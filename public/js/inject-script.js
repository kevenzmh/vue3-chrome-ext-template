// Google Ads 拦截器 - 修复版
(function() {
  'use strict';

  console.log('%c[Google Ads Interceptor] 🎯 拦截器已加载', 'color: #00ff00; font-weight: bold;');

  if (window.__googleAdsInterceptorInstalled) {
    console.log('[Google Ads Interceptor] 已安装，跳过');
    return;
  }
  window.__googleAdsInterceptorInstalled = true;

  const stats = {
    total: 0,
    intercepted: 0,
    modified: 0,
    urls: []
  };

  let config = {
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

  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type === 'UPDATE_INTERCEPTOR_CONFIG') {
      config = event.data.config;
      console.log('%c[Interceptor] ✅ 配置已更新', 'color: #00bfff;', config);
    }
  });

  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    stats.total++;
    
    // 排除不需要的请求
    if (!url || 
        url.includes('ipl_status') || 
        url.includes('heartbeat') ||
        url.includes('google-analytics') ||
        url.includes('gstatic')) {
      return originalFetch.apply(this, args);
    }
    
    // 只拦截关键的 RPC 请求
    const shouldIntercept = url.includes('/_/rpc/') || 
                           url.includes('OverviewService') ||
                           url.includes('AdGroupService') ||
                           url.includes('CampaignService');
    
    if (!shouldIntercept) {
      return originalFetch.apply(this, args);
    }
    
    stats.intercepted++;
    stats.urls.push(url);
    
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ff9800; font-weight: bold;');
    console.log('%c🎯 拦截到数据请求！', 'color: #ff9800; font-weight: bold; font-size: 14px;');
    console.log('URL:', url);
    
    try {
      const response = await originalFetch.apply(this, args);
      
      // 跳过空响应
      if (response.status === 204 || response.status === 0) {
        console.log('⚠️  空响应，跳过处理');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ff9800;');
        return response;
      }
      
      const clone = response.clone();
      const text = await clone.text();
      
      console.log('✅ 状态:', response.status);
      console.log('📦 长度:', text.length, 'bytes');
      console.log('📄 前500字符:', text.substring(0, 500));
      
      let modifiedText = text;
      
      try {
        modifiedText = modifyResponse(text);
        
        if (modifiedText !== text) {
          stats.modified++;
          console.log('%c✨ 数据已修改！', 'color: #4caf50; font-weight: bold; font-size: 14px;');
          console.log('修改后:', modifiedText.substring(0, 500));
        } else {
          console.log('ℹ️  未找到可修改的数据');
        }
      } catch (e) {
        console.error('❌ 修改失败:', e);
      }
      
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #ff9800;');
      
      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      
    } catch (error) {
      console.error('❌ 错误:', error);
      return originalFetch.apply(this, args);
    }
  };

  function modifyResponse(text) {
    let jsonText = text;
    let hasPrefix = false;
    
    if (text.startsWith(")]}'\n")) {
      jsonText = text.substring(5);
      hasPrefix = true;
      console.log('✓ Google RPC 前缀');
    }
    
    try {
      const data = JSON.parse(jsonText);
      console.log('✓ JSON 解析成功');
      console.log('类型:', Array.isArray(data) ? '数组' : typeof data);
      
      const modified = deepModify(data);
      
      let result = JSON.stringify(modified);
      if (hasPrefix) {
        result = ")]}'\n" + result;
      }
      
      return result;
    } catch (e) {
      console.log('✗ JSON 解析失败，尝试正则');
      return regexModify(text);
    }
  }

  function deepModify(data, path = '') {
    if (data == null) return data;
    
    if (Array.isArray(data)) {
      return data.map((item, i) => deepModify(item, `${path}[${i}]`));
    }
    
    if (typeof data === 'object') {
      const result = {};
      
      for (const key in data) {
        const value = data[key];
        const keyLower = String(key).toLowerCase();
        const currentPath = path ? `${path}.${key}` : key;
        
        // 检查是否是数字字段
        const isNumeric = typeof value === 'number' || 
                         (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value));
        
        if (isNumeric) {
          // 展示次数
          if (keyLower.includes('impression') || keyLower.includes('impr')) {
            const newVal = parseNumber(config.globalData.impressions);
            result[key] = newVal;
            console.log(`  🔧 ${currentPath}: ${value} → ${newVal}`);
            continue;
          }
          
          // 点击次数
          if (keyLower.includes('click') && !keyLower.includes('rate') && !keyLower.includes('cpc')) {
            const newVal = parseNumber(config.globalData.clicks);
            result[key] = newVal;
            console.log(`  🔧 ${currentPath}: ${value} → ${newVal}`);
            continue;
          }
          
          // 转化次数
          if (keyLower.includes('conv')) {
            const newVal = parseNumber(config.globalData.conversions);
            result[key] = newVal;
            console.log(`  🔧 ${currentPath}: ${value} → ${newVal}`);
            continue;
          }
          
          // 费用
          if (keyLower.includes('cost') || keyLower.includes('spend')) {
            const cost = parseFloat(config.globalData.cost.replace(/[^0-9.]/g, ''));
            const newVal = typeof value === 'number' && value > 100000 
              ? Math.round(cost * 1000000) 
              : cost;
            result[key] = newVal;
            console.log(`  🔧 ${currentPath}: ${value} → ${newVal}`);
            continue;
          }
        }
        
        result[key] = deepModify(value, currentPath);
      }
      
      return result;
    }
    
    return data;
  }

  function regexModify(text) {
    let result = text;
    let count = 0;
    
    const patterns = [
      [/"impressions?"\s*:\s*(\d+)/gi, parseNumber(config.globalData.impressions)],
      [/"clicks?"\s*:\s*(\d+)/gi, parseNumber(config.globalData.clicks)],
      [/"conversions?"\s*:\s*(\d+)/gi, parseNumber(config.globalData.conversions)]
    ];
    
    patterns.forEach(([regex, value]) => {
      const before = result;
      result = result.replace(regex, (match, num) => {
        count++;
        return match.replace(num, value);
      });
      if (result !== before) {
        console.log(`  ✓ 正则替换成功`);
      }
    });
    
    return result;
  }

  function parseNumber(value) {
    if (typeof value === 'number') return value;
    return parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
  }

  window.__googleAdsInterceptor = {
    printStats: function() {
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0;');
      console.log('%c📊 统计', 'color: #9c27b0; font-weight: bold;');
      console.log(`总: ${stats.total} | 拦截: ${stats.intercepted} | 修改: ${stats.modified}`);
      if (stats.urls.length > 0) {
        console.log('\n拦截的URL:');
        stats.urls.forEach((u, i) => console.log(`  ${i+1}. ${u}`));
      }
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0;');
    },
    getConfig: () => config,
    updateData: (newData) => {
      config.globalData = {...config.globalData, ...newData};
      console.log('✅ 数据已更新:', config.globalData);
    }
  };

  console.log('%c[Google Ads Interceptor] ✅ 初始化完成', 'color: #00ff00; font-weight: bold;');
  console.log('💡 window.__googleAdsInterceptor.printStats() 查看统计');
})();
