// Google Ads 数据拦截和修改脚本
(function() {
  'use strict';

  console.log('[Google Ads Interceptor] 注入脚本开始加载...');

  // 确保 ajax-hook 已加载
  if (!window.ah) {
    console.error('[Google Ads Interceptor] ajax-hook 未加载!');
    return;
  }

  console.log('[Google Ads Interceptor] ajax-hook 已就绪');

  // 配置变量
  let config = {
    globalData: {
      impressions: "50000",
      clicks: "3000", 
      conversions: "60",
      cost: "840.00",
      ctr: "6.00%",
      cpc: "0.28",
      conversionRate: "2.00%",
      cpa: "14.00"
    },
    adGroups: [],
    settings: {
      verbose: true,
      enableGlobalData: false
    }
  };

  // 统计信息
  const stats = {
    totalRequests: 0,
    interceptedRequests: 0,
    modifiedResponses: 0
  };

  /**
   * 判断是否是目标API请求
   */
  function isTargetRequest(url) {
    if (!url) return false;
    
    const targetPatterns = [
      '/rpc/OverviewService/Get',
      '/rpc/AdGroupService',
      '/rpc/CampaignService',
      '/rpc/AdGroupAdService',
      'BatchService.Batch'
    ];
    
    return targetPatterns.some(pattern => url.includes(pattern));
  }

  /**
   * 修改响应数据
   */
  function modifyResponseData(responseText, url) {
    try {
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return responseText;
      }

      if (config.settings.verbose) {
        console.log('[Google Ads Interceptor] 准备修改数据:', {
          url: url,
          dataType: typeof data,
          dataKeys: Object.keys(data || {})
        });
      }

      if (url.includes('OverviewService')) {
        data = modifyOverviewData(data);
      } else if (url.includes('AdGroupService') || url.includes('BatchService')) {
        data = modifyAdGroupData(data);
      }

      return JSON.stringify(data);
    } catch (error) {
      console.error('[Google Ads Interceptor] 修改数据时出错:', error);
      return responseText;
    }
  }

  /**
   * 修改概览数据
   */
  function modifyOverviewData(data) {
    if (!data || typeof data !== 'object') return data;

    const globalData = config.globalData;
    let modifiedCount = 0;
    
    function traverse(obj, path = '') {
      if (!obj || typeof obj !== 'object') return;

      if (config.settings.enableGlobalData) {
        if (obj.hasOwnProperty('clicks')) {
          obj.clicks = globalData.clicks;
          modifiedCount++;
          console.log(`[Modify] ${path}.clicks = ${globalData.clicks}`);
        }
        if (obj.hasOwnProperty('impressions')) {
          obj.impressions = globalData.impressions;
          modifiedCount++;
          console.log(`[Modify] ${path}.impressions = ${globalData.impressions}`);
        }
        if (obj.hasOwnProperty('cost')) {
          obj.cost = globalData.cost;
          modifiedCount++;
          console.log(`[Modify] ${path}.cost = ${globalData.cost}`);
        }
        if (obj.hasOwnProperty('conversions')) {
          obj.conversions = globalData.conversions;
          modifiedCount++;
          console.log(`[Modify] ${path}.conversions = ${globalData.conversions}`);
        }
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
      } else {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            traverse(obj[key], path ? `${path}.${key}` : key);
          }
        });
      }
    }

    traverse(data);
    
    if (modifiedCount > 0) {
      console.log(`[Google Ads Interceptor] 修改了 ${modifiedCount} 个字段`);
    }
    
    return data;
  }

  /**
   * 修改广告组数据
   */
  function modifyAdGroupData(data) {
    if (!data || typeof data !== 'object') return data;
    
    function processAdGroups(obj, path = '') {
      if (!obj || typeof obj !== 'object') return;

      if (obj.name || obj.ad_group_name || obj.adGroupName) {
        const nameField = obj.name ? 'name' : (obj.ad_group_name ? 'ad_group_name' : 'adGroupName');
        const adGroupName = obj[nameField];

        config.adGroups.forEach(rule => {
          let isMatch = false;

          if (rule.match.name && rule.match.name === adGroupName) {
            isMatch = true;
          } else if (rule.match.namePattern) {
            try {
              const pattern = new RegExp(rule.match.namePattern.slice(1, -1));
              if (pattern.test(adGroupName)) {
                isMatch = true;
              }
            } catch (e) {
              console.error('[Google Ads Interceptor] 正则表达式错误:', e);
            }
          }

          if (isMatch && rule.displayData) {
            console.log(`[Google Ads Interceptor] 匹配到广告组: ${adGroupName}`);
            
            Object.keys(rule.displayData).forEach(key => {
              const possibleKeys = [
                key,
                key.replace(/_/g, ''),
                key.replace(/([A-Z])/g, '_$1').toLowerCase()
              ];

              possibleKeys.forEach(possibleKey => {
                if (obj.hasOwnProperty(possibleKey)) {
                  obj[possibleKey] = rule.displayData[key];
                  console.log(`[Modify] ${path}.${possibleKey} = ${rule.displayData[key]}`);
                }
              });
            });
          }
        });
      }

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => processAdGroups(item, `${path}[${index}]`));
      } else {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            processAdGroups(obj[key], path ? `${path}.${key}` : key);
          }
        });
      }
    }

    processAdGroups(data);
    return data;
  }

  /**
   * 设置拦截器
   */
  function setupInterceptor() {
    console.log('[Google Ads Interceptor] 设置拦截器...');

    window.ah.proxy({
      onRequest: function(config, handler) {
        stats.totalRequests++;
        
        if (isTargetRequest(config.url)) {
          stats.interceptedRequests++;
          console.log('[Google Ads Interceptor] 拦截请求:', config.url);
        }
        
        handler.next(config);
      },
      
      onResponse: function(response, handler) {
        const url = response.config.url;
        
        if (isTargetRequest(url)) {
          try {
            const originalResponse = response.response;
            const modifiedResponse = modifyResponseData(originalResponse, url);
            
            if (modifiedResponse !== originalResponse) {
              stats.modifiedResponses++;
              response.response = modifiedResponse;
              
              console.log('[Google Ads Interceptor] 已修改响应');
              console.log('  统计:', stats);
            }
          } catch (error) {
            console.error('[Google Ads Interceptor] 处理响应时出错:', error);
          }
        }
        
        handler.next(response);
      },
      
      onError: function(error, handler) {
        console.error('[Google Ads Interceptor] 请求错误:', error);
        handler.next(error);
      }
    });

    console.log('[Google Ads Interceptor] 拦截器已激活!');
  }

  /**
   * 接收配置更新
   */
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'UPDATE_INTERCEPTOR_CONFIG') {
      config = { ...config, ...event.data.config };
      console.log('[Google Ads Interceptor] 配置已更新:', config);
    }
  });

  /**
   * 暴露 API
   */
  window.__googleAdsInterceptor = {
    config: config,
    stats: stats,
    updateConfig: (newConfig) => {
      config = { ...config, ...newConfig };
      console.log('[Google Ads Interceptor] 配置已更新:', config);
    },
    getStats: () => stats,
    reset: () => {
      stats.totalRequests = 0;
      stats.interceptedRequests = 0;
      stats.modifiedResponses = 0;
      console.log('[Google Ads Interceptor] 统计已重置');
    }
  };

  // 初始化
  setupInterceptor();
  
  console.log('[Google Ads Interceptor] 加载完成! 可通过 window.__googleAdsInterceptor 访问');
})();
