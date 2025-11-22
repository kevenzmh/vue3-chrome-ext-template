// 通用 Google Ads RPC 拦截器 - 拦截所有请求并显示详细信息
(function() {
  'use strict';

  console.log('%c[Google Ads Interceptor] 🔍 通用拦截器已加载', 'color: #00ff00; font-weight: bold; font-size: 14px;');

  if (window.__googleAdsInterceptorInstalled) {
    console.log('[Google Ads Interceptor] 已安装，跳过');
    return;
  }
  window.__googleAdsInterceptorInstalled = true;

  // 统计
  const stats = {
    total: 0,
    intercepted: 0,
    modified: 0,
    allUrls: [],
    interceptedUrls: []
  };

  // 配置
  let config = {
    adGroups: [],
    globalData: {
      impressions: '50000',
      clicks: '3000',
      conversions: '60',
      cost: '840.00',
      ctr: '6.00%',
      cpc: '0.28',
      conversionRate: '2.00%',
      cpa: '14.00'
    },
    settings: {
      verbose: true,
      enableGlobalData: true
    }
  };

  // 监听配置更新
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'UPDATE_INTERCEPTOR_CONFIG') {
      config = event.data.config;
      console.log('%c[Google Ads Interceptor] ✅ 配置已更新', 'color: #00bfff; font-weight: bold;', config);
    }
  });

  // ==================== 拦截 Fetch ====================
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, options] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    
    stats.total++;
    
    // 记录所有请求
    if (url && !url.includes('google-analytics') && !url.includes('gstatic')) {
      stats.allUrls.push(url);
      
      // 每个请求都打印出来
      console.log(`%c[Fetch #${stats.total}] ${url.substring(0, 100)}...`, 'color: #999; font-size: 11px;');
    }

    // 非常宽松的拦截条件 - 拦截所有 Google Ads 相关请求
    const shouldIntercept = url && (
      url.includes('ads.google.com') ||
      url.includes('/aw/') ||
      url.includes('/_/') ||
      url.includes('/rpc/') ||
      url.includes('OverviewService') ||
      url.includes('AdGroupService') ||
      url.includes('CampaignService')
    );

    if (!shouldIntercept) {
      return originalFetch.apply(this, args);
    }

    stats.intercepted++;
    stats.interceptedUrls.push(url);
    
    console.log('%c[Google Ads Interceptor] 🎯 拦截到请求！', 'color: #ff9800; font-weight: bold; font-size: 13px;');
    console.log('  URL:', url);
    console.log('  Method:', options?.method || 'GET');

    try {
      // 调用原始请求
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      
      // 读取响应
      const text = await clonedResponse.text();
      
      console.log('%c[Google Ads Interceptor] 📥 响应信息:', 'color: #2196f3; font-weight: bold;');
      console.log('  状态:', response.status);
      console.log('  Content-Type:', response.headers.get('content-type'));
      console.log('  长度:', text.length, 'bytes');
      console.log('  前500字符:', text.substring(0, 500));

      // 尝试修改
      let modifiedText = text;
      
      try {
        modifiedText = modifyResponse(text, url);
        
        if (modifiedText !== text) {
          stats.modified++;
          console.log('%c[Google Ads Interceptor] ✨ 数据已修改！', 'color: #4caf50; font-weight: bold; font-size: 13px;');
          console.log('  修改后的前500字符:', modifiedText.substring(0, 500));
        } else {
          console.log('%c[Google Ads Interceptor] ℹ️ 数据未修改（未找到可修改的字段）', 'color: #ff9800;');
        }
      } catch (error) {
        console.error('[Google Ads Interceptor] ❌ 修改数据时出错:', error);
      }

      console.log('---');

      // 创建新响应
      const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      Object.defineProperty(modifiedResponse, 'url', { value: response.url });

      return modifiedResponse;

    } catch (error) {
      console.error('[Google Ads Interceptor] ❌ 处理请求时出错:', error);
      return originalFetch.apply(this, args);
    }
  };

  console.log('%c[Google Ads Interceptor] ✅ Fetch 拦截器已安装', 'color: #00ff00; font-weight: bold;');

  // ==================== 数据修改逻辑 ====================

  function modifyResponse(text, url) {
    console.log('[Google Ads Interceptor] 🔄 开始分析响应数据...');

    // 处理 Google RPC 格式
    let jsonText = text;
    let hasPrefix = false;
    
    if (text.startsWith(")]}'\n")) {
      jsonText = text.substring(5);
      hasPrefix = true;
      console.log('  检测到 Google RPC 安全前缀');
    }

    // 尝试 JSON 解析
    try {
      const data = JSON.parse(jsonText);
      console.log('  ✓ JSON 解析成功');
      console.log('  数据类型:', typeof data);
      console.log('  是否为数组:', Array.isArray(data));
      
      if (Array.isArray(data)) {
        console.log('  数组长度:', data.length);
        console.log('  数组内容:', data);
      } else {
        console.log('  对象键:', Object.keys(data));
      }

      // 深度修改
      const modifiedData = deepModify(data);

      let result = JSON.stringify(modifiedData);
      if (hasPrefix) {
        result = ")]}'\n" + result;
      }

      return result;

    } catch (error) {
      console.log('  ✗ JSON 解析失败，尝试正则替换');
      return regexModify(text);
    }
  }

  function deepModify(data, path = '') {
    if (data === null || data === undefined) {
      return data;
    }

    // 数组
    if (Array.isArray(data)) {
      return data.map((item, index) => deepModify(item, `${path}[${index}]`));
    }

    // 对象
    if (typeof data === 'object') {
      const modified = {};
      let hasModification = false;
      
      for (const key in data) {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        const keyLower = String(key).toLowerCase();
        
        // 检查是否应该修改这个字段
        if (isMetricField(keyLower, value)) {
          const newValue = getModifiedValue(keyLower, value);
          modified[key] = newValue;
          
          if (newValue !== value) {
            hasModification = true;
            console.log(`  🔧 修改: ${currentPath} = ${value} → ${newValue}`);
          }
        } else {
          modified[key] = deepModify(value, currentPath);
        }
      }
      
      return modified;
    }

    return data;
  }

  function isMetricField(key, value) {
    // 必须是数字类型
    if (typeof value !== 'number' && typeof value !== 'string') {
      return false;
    }

    // 字符串必须是纯数字
    if (typeof value === 'string') {
      if (!/^\d+(\.\d+)?$/.test(value.trim())) {
        return false;
      }
    }

    // 指标关键词
    const keywords = [
      'impression', 'impr', 'imp',
      'click',
      'conversion', 'conv',
      'cost', 'spend', 'amount',
      'ctr', 'clickrate',
      'cpc', 'avgcpc',
      'cpa', 'costper',
      'rate', 'ratio', 'percent'
    ];

    return keywords.some(keyword => key.includes(keyword));
  }

  function getModifiedValue(key, originalValue) {
    const g = config.globalData;

    // 展示次数
    if (key.includes('impr') || key.includes('impression')) {
      return parseNumber(g.impressions);
    }
    
    // 点击次数
    if (key.includes('click') && !key.includes('rate') && !key.includes('cpc')) {
      return parseNumber(g.clicks);
    }
    
    // 转化次数
    if (key.includes('conv')) {
      return parseNumber(g.conversions);
    }
    
    // 费用
    if (key.includes('cost') || key.includes('spend') || key.includes('amount')) {
      const cost = parseFloat(g.cost.replace(/[^0-9.]/g, ''));
      
      // 如果原值超过10万，可能是微单位（micros）
      if (typeof originalValue === 'number' && originalValue > 100000) {
        return Math.round(cost * 1000000);
      }
      return cost;
    }
    
    // 点击率
    if (key.includes('ctr') || key.includes('clickrate')) {
      return parsePercent(g.ctr);
    }
    
    // CPC
    if (key.includes('cpc') || key.includes('avgcpc')) {
      return parseFloat(g.cpc.replace(/[^0-9.]/g, ''));
    }
    
    // 转化率
    if (key.includes('convrate') || key.includes('conversionrate')) {
      return parsePercent(g.conversionRate);
    }
    
    // CPA
    if (key.includes('cpa') || key.includes('costper')) {
      return parseFloat(g.cpa.replace(/[^0-9.]/g, ''));
    }

    return originalValue;
  }

  function regexModify(text) {
    console.log('  使用正则表达式进行替换...');
    let modified = text;
    let changeCount = 0;
    const g = config.globalData;

    const patterns = [
      { name: 'impressions', regex: /"impressions?"\s*:\s*"?(\d+)"?/gi, value: parseNumber(g.impressions) },
      { name: 'clicks', regex: /"clicks?"\s*:\s*"?(\d+)"?/gi, value: parseNumber(g.clicks) },
      { name: 'conversions', regex: /"conversions?"\s*:\s*"?(\d+)"?/gi, value: parseNumber(g.conversions) },
      { name: 'cost', regex: /"cost"\s*:\s*"?(\d+\.?\d*)"?/gi, value: parseFloat(g.cost.replace(/[^0-9.]/g, '')) }
    ];

    patterns.forEach(({ name, regex, value }) => {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        console.log(`  找到 ${matches.length} 个 ${name} 字段`);
        modified = modified.replace(regex, (match) => {
          changeCount++;
          return match.replace(/\d+\.?\d*/, value);
        });
      }
    });

    if (changeCount > 0) {
      console.log(`  ✓ 通过正则替换修改了 ${changeCount} 个字段`);
    } else {
      console.log(`  ✗ 未找到可替换的字段`);
    }

    return modified;
  }

  function parseNumber(value) {
    if (typeof value === 'number') return value;
    return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
  }

  function parsePercent(value) {
    if (typeof value === 'number') return value;
    const num = parseFloat(String(value).replace(/%/g, ''));
    return num / 100;
  }

  function printStats() {
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0;');
    console.log('%c📊 拦截器统计信息', 'color: #9c27b0; font-weight: bold; font-size: 14px;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0;');
    console.log(`总请求数: ${stats.total}`);
    console.log(`拦截数: ${stats.intercepted}`);
    console.log(`修改数: ${stats.modified}`);
    console.log(`拦截率: ${((stats.intercepted / stats.total) * 100).toFixed(2)}%`);
    console.log(`修改率: ${((stats.modified / stats.total) * 100).toFixed(2)}%`);
    console.log('\n最近10个请求:');
    stats.allUrls.slice(-10).forEach((url, i) => {
      console.log(`  ${i + 1}. ${url.substring(0, 80)}...`);
    });
    console.log('\n拦截的请求:');
    if (stats.interceptedUrls.length === 0) {
      console.log('  (暂无)');
    } else {
      stats.interceptedUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0;');
  }

  // 全局接口
  window.__googleAdsInterceptor = {
    getStats: () => stats,
    getConfig: () => config,
    printStats: printStats,
    setVerbose: (v) => {
      config.settings.verbose = v;
      console.log(`详细日志已${v ? '启用' : '禁用'}`);
    },
    updateData: (newData) => {
      config.globalData = { ...config.globalData, ...newData };
      console.log('✅ 数据已更新:', config.globalData);
      console.log('💡 请刷新页面或触发新的请求以查看效果');
    }
  };

  // 定期打印统计
  setInterval(() => {
    if (stats.total > 0) {
      console.log(`%c[拦截器活跃] 总请求:${stats.total} | 拦截:${stats.intercepted} | 修改:${stats.modified}`, 'color: #666; font-size: 11px;');
    }
  }, 10000);

  console.log('%c[Google Ads Interceptor] 🎉 初始化完成！', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff00;');
  console.log('%c💡 使用方法:', 'color: #00bfff; font-weight: bold;');
  console.log('  window.__googleAdsInterceptor.printStats()  - 查看统计');
  console.log('  window.__googleAdsInterceptor.getConfig()   - 查看配置');
  console.log('  window.__googleAdsInterceptor.updateData({ impressions: "999999" })  - 更新数据');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #00ff00;');
  console.log('%c现在会详细记录每个请求，请刷新页面或进行操作', 'color: #ff9800;');
})();
