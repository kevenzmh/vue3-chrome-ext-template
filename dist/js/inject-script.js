// 专门针对 Google Ads OverviewService 的拦截器
(function() {
  'use strict';

  console.log('%c[OverviewService Interceptor] 🎯 拦截器已加载', 'color: #00ff00; font-weight: bold; font-size: 14px;');

  if (window.__overviewServiceInterceptorInstalled) {
    console.log('[OverviewService Interceptor] 已安装，跳过');
    return;
  }
  window.__overviewServiceInterceptorInstalled = true;

  // 统计
  const stats = {
    total: 0,
    intercepted: 0,
    modified: 0,
    urls: []
  };

  // 配置
  let config = {
    adGroups: [],
    globalData: {},
    settings: {
      verbose: true,
      enableGlobalData: true  // 默认启用全局数据以便快速测试
    }
  };

  // 监听配置更新
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'UPDATE_INTERCEPTOR_CONFIG') {
      config = event.data.config;
      console.log('%c[OverviewService Interceptor] ✅ 配置已更新', 'color: #00bfff; font-weight: bold;', config);
    }
  });

  // ==================== 拦截 Fetch ====================
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, options] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    
    stats.total++;

    // 检查是否是目标请求
    const isTargetRequest = url && (
      url.includes('OverviewService') ||
      url.includes('/_/rpc/') ||
      url.includes('/aw_essentials/') ||
      url.includes('ads.google.com/aw')
    );

    if (!isTargetRequest) {
      return originalFetch.apply(this, args);
    }

    stats.intercepted++;
    stats.urls.push(url);
    
    console.log('%c[OverviewService Interceptor] 🎯 拦截到目标请求！', 'color: #ff9800; font-weight: bold;');
    console.log('  URL:', url);

    try {
      // 调用原始请求
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      
      // 读取响应
      const text = await clonedResponse.text();
      
      if (config.settings.verbose) {
        console.log('%c[OverviewService Interceptor] 📥 原始响应:', 'color: #2196f3;');
        console.log('  长度:', text.length, 'bytes');
        console.log('  前300字符:', text.substring(0, 300));
      }

      // 修改数据
      let modifiedText = text;
      
      try {
        modifiedText = modifyResponse(text, url);
        
        if (modifiedText !== text) {
          stats.modified++;
          console.log('%c[OverviewService Interceptor] ✨ 数据已修改！', 'color: #4caf50; font-weight: bold;');
        }
      } catch (error) {
        console.error('[OverviewService Interceptor] 修改数据时出错:', error);
      }

      // 创建新的响应
      const modifiedResponse = new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      Object.defineProperty(modifiedResponse, 'url', { value: response.url });

      // 定期打印统计
      if (stats.intercepted % 3 === 0) {
        printStats();
      }

      return modifiedResponse;

    } catch (error) {
      console.error('[OverviewService Interceptor] 处理请求时出错:', error);
      return originalFetch.apply(this, args);
    }
  };

  console.log('%c[OverviewService Interceptor] ✅ Fetch 拦截器已安装', 'color: #00ff00; font-weight: bold;');

  // ==================== 数据修改逻辑 ====================

  function modifyResponse(text, url) {
    // Google RPC 响应通常以 )]}'\n 开头
    let jsonText = text;
    let hasPrefix = false;
    
    if (text.startsWith(")]}'\n")) {
      jsonText = text.substring(5);
      hasPrefix = true;
    }

    try {
      // 尝试解析 JSON
      const data = JSON.parse(jsonText);
      
      if (config.settings.verbose) {
        console.log('[OverviewService Interceptor] 📊 解析的数据类型:', typeof data);
        console.log('[OverviewService Interceptor] 📊 是否为数组:', Array.isArray(data));
        if (Array.isArray(data)) {
          console.log('[OverviewService Interceptor] 📊 数组长度:', data.length);
        }
      }

      // 修改数据
      const modifiedData = deepModify(data);

      // 序列化回 JSON
      let result = JSON.stringify(modifiedData);
      
      // 加回前缀
      if (hasPrefix) {
        result = ")]}'\n" + result;
      }

      if (config.settings.verbose) {
        console.log('[OverviewService Interceptor] ✅ 数据已成功修改并序列化');
      }

      return result;

    } catch (error) {
      console.error('[OverviewService Interceptor] JSON 解析失败:', error);
      console.log('[OverviewService Interceptor] 尝试正则替换...');
      
      // 使用正则替换作为备用方案
      return regexModify(text);
    }
  }

  function deepModify(data) {
    if (data === null || data === undefined) {
      return data;
    }

    // 如果是数组
    if (Array.isArray(data)) {
      return data.map(item => deepModify(item));
    }

    // 如果是对象
    if (typeof data === 'object') {
      const modified = {};
      
      for (const key in data) {
        const value = data[key];
        
        // 检查键名是否包含指标关键词
        const keyLower = String(key).toLowerCase();
        
        // 尝试修改指标
        if (shouldModifyField(keyLower, value)) {
          modified[key] = getModifiedValue(keyLower, value);
          
          if (config.settings.verbose && modified[key] !== value) {
            console.log(`  修改字段: ${key} = ${value} → ${modified[key]}`);
          }
        } else {
          modified[key] = deepModify(value);
        }
      }
      
      return modified;
    }

    return data;
  }

  function shouldModifyField(key, value) {
    // 只修改数字或数字字符串
    if (typeof value !== 'number' && typeof value !== 'string') {
      return false;
    }

    // 检查是否是数字值
    if (typeof value === 'string' && !/^\d+(\.\d+)?$/.test(value)) {
      return false;
    }

    const keywords = [
      'impression', 'impr',
      'click', 
      'conversion', 'conv',
      'cost', 'spend',
      'ctr', 'click_rate',
      'cpc', 'avg_cpc',
      'cpa', 'cost_per',
      'rate', 'ratio'
    ];

    return keywords.some(keyword => key.includes(keyword));
  }

  function getModifiedValue(key, originalValue) {
    const globalData = config.globalData;

    // 展示次数
    if (key.includes('impression') || key.includes('impr')) {
      return parseNumber(globalData.impressions || '50000');
    }
    
    // 点击次数
    if (key.includes('click') && !key.includes('rate') && !key.includes('cpc')) {
      return parseNumber(globalData.clicks || '3000');
    }
    
    // 转化次数
    if (key.includes('conversion') || key.includes('conv')) {
      return parseNumber(globalData.conversions || '60');
    }
    
    // 费用
    if (key.includes('cost') || key.includes('spend')) {
      const cost = parseFloat((globalData.cost || '840.00').replace(/[^0-9.]/g, ''));
      
      // 如果原值很大，可能是微单位
      if (typeof originalValue === 'number' && originalValue > 100000) {
        return Math.round(cost * 1000000);
      }
      return cost;
    }
    
    // 点击率
    if (key.includes('ctr') || key === 'click_rate') {
      return parsePercent(globalData.ctr || '6.00%');
    }
    
    // 每次点击费用
    if (key.includes('cpc') || key.includes('avg_cpc')) {
      return parseFloat((globalData.cpc || '0.28').replace(/[^0-9.]/g, ''));
    }
    
    // 转化率
    if (key.includes('conv_rate') || key.includes('conversion_rate')) {
      return parsePercent(globalData.conversionRate || '2.00%');
    }
    
    // 每次转化费用
    if (key.includes('cpa') || key.includes('cost_per_conversion')) {
      return parseFloat((globalData.cpa || '14.00').replace(/[^0-9.]/g, ''));
    }

    return originalValue;
  }

  function regexModify(text) {
    let modified = text;
    const globalData = config.globalData;

    try {
      // 替换各种可能的数字格式
      const replacements = [
        { pattern: /"impressions?"\s*:\s*(\d+)/gi, value: parseNumber(globalData.impressions || '50000') },
        { pattern: /"clicks?"\s*:\s*(\d+)/gi, value: parseNumber(globalData.clicks || '3000') },
        { pattern: /"conversions?"\s*:\s*(\d+)/gi, value: parseNumber(globalData.conversions || '60') },
        { pattern: /"cost"\s*:\s*(\d+\.?\d*)/gi, value: parseFloat((globalData.cost || '840.00').replace(/[^0-9.]/g, '')) }
      ];

      replacements.forEach(({ pattern, value }) => {
        const matches = modified.match(pattern);
        if (matches) {
          console.log(`  正则匹配到: ${matches[0]}`);
          modified = modified.replace(pattern, (match, num) => {
            return match.replace(num, value);
          });
        }
      });

    } catch (error) {
      console.error('[OverviewService Interceptor] 正则替换失败:', error);
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
    console.log('%c[OverviewService Interceptor] 📊 统计', 'color: #9c27b0; font-weight: bold;');
    console.log(`  总请求: ${stats.total}`);
    console.log(`  拦截: ${stats.intercepted}`);
    console.log(`  修改: ${stats.modified}`);
    console.log(`  拦截的URL:`, stats.urls);
  }

  // 全局调试接口
  window.__overviewInterceptor = {
    getStats: () => stats,
    getConfig: () => config,
    printStats: printStats,
    setVerbose: (verbose) => {
      config.settings.verbose = verbose;
      console.log(`详细日志已${verbose ? '启用' : '禁用'}`);
    }
  };

  console.log('%c[OverviewService Interceptor] 🎉 初始化完成！', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  console.log('%c  现在会拦截所有 OverviewService 和 RPC 请求', 'color: #999;');
  console.log('%c  使用 window.__overviewInterceptor.printStats() 查看统计', 'color: #999;');
})();
