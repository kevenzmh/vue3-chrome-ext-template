// Google Ads 数据替换器
(function() {
  'use strict';

  // 检查页面
  if (!window.location.href.includes('ads.google.com')) {
    return;
  }

  console.log('[Data Replacer] 初始化中...');

  // ==================== 配置数据 ====================
  // 在这里修改你想要显示的数据
  const SERVER_DATA = {
    // 账户总览数据
    accountCost: {
      clicks: 15234,
      impressions: 234567,
      cost: 4567.89,
      conversions: 234,
      ctr: 6.49,
      cpc: 0.30,
      conversionRate: 1.54,
      cpa: 19.52,
      costPerConversion: 19.52,
      averageCpm: 19.47,
      videoViews: 12345
    },
    
    // 广告系列数据
    campaignCost: [
      {
        id: 'campaign_1',
        name: '示例广告系列1',
        status: 2,
        budget: 1000,
        stats: {
          clicks: 5678,
          impressions: 89012,
          cost: 1567.89,
          conversions: 78,
          ctr: 6.38,
          cpc: 0.28,
          conversionRate: 1.37,
          cpa: 20.10
        }
      },
      {
        id: 'campaign_2',
        name: '示例广告系列2',
        status: 1,
        budget: 2000,
        stats: {
          clicks: 9556,
          impressions: 145555,
          cost: 3000.00,
          conversions: 156,
          ctr: 6.56,
          cpc: 0.31,
          conversionRate: 1.63,
          cpa: 19.23
        }
      }
    ],
    
    // 广告组数据
    adgroupCost: [
      {
        id: 'adgroup_1',
        campaignId: 'campaign_1',
        name: '测试广告组1',
        status: 1,
        stats: {
          clicks: 2345,
          impressions: 34567,
          cost: 678.90,
          conversions: 34,
          ctr: 6.78,
          cpc: 0.29,
          conversionRate: 1.45,
          cpa: 19.97
        }
      },
      {
        id: 'adgroup_2',
        campaignId: 'campaign_1',
        name: '测试广告组2',
        status: 1,
        stats: {
          clicks: 3333,
          impressions: 54445,
          cost: 888.99,
          conversions: 44,
          ctr: 6.12,
          cpc: 0.27,
          conversionRate: 1.32,
          cpa: 20.20
        }
      }
    ],
    
    // 广告数据
    adCost: [
      {
        id: 'ad_1',
        adgroupId: 'adgroup_1',
        name: '广告示例1',
        status: 1,
        stats: {
          clicks: 1234,
          impressions: 18900,
          cost: 345.60,
          conversions: 18,
          ctr: 6.53,
          cpc: 0.28,
          conversionRate: 1.46,
          cpa: 19.20
        }
      }
    ],
    
    // 关键词数据
    keywordCost: [
      {
        keyword: '示例关键词',
        matchType: 'BROAD',
        stats: {
          clicks: 567,
          impressions: 8900,
          cost: 156.78,
          conversions: 8,
          ctr: 6.37,
          cpc: 0.28,
          conversionRate: 1.41,
          cpa: 19.60
        }
      }
    ],
    
    // 折线图数据
    accountCostChart: [
      { date: '2025-10-01', clicks: 1234, impressions: 19000, cost: 345.60, cpc: 0.28 },
      { date: '2025-10-02', clicks: 1567, impressions: 24000, cost: 438.76, cpc: 0.28 },
      { date: '2025-10-03', clicks: 1890, impressions: 29000, cost: 529.20, cpc: 0.28 }
    ],
    
    // 受众数据
    audiencesCost: [
      { type: 1, name: '18-24岁', clicks: 234, impressions: 3456, cost: 65.52, conversions: 3 },
      { type: 1, name: '25-34岁', clicks: 456, impressions: 6789, cost: 127.68, conversions: 6 },
      { type: 2, name: '男性', clicks: 345, impressions: 5123, cost: 96.60, conversions: 4 },
      { type: 2, name: '女性', clicks: 345, impressions: 5123, cost: 96.60, conversions: 5 },
      { type: 3, name: '高收入', clicks: 234, impressions: 3456, cost: 65.52, conversions: 3 }
    ],
    
    // 账单数据
    bill: {
      balance: 50000,
      lastPaymentAmount: 20000,
      lastPaymentDate: '20251005',
      payments: 30000,
      tax: 500
    }
  };
  // ==================== 配置结束 ====================

  let isInjected = false;

  // 注入 ajaxhook
  function injectAjaxHook(callback) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('lib/ajaxhook.min.js');
    script.onload = () => {
      console.log('[Data Replacer] ajaxhook 已加载');
      callback();
    };
    script.onerror = () => {
      console.error('[Data Replacer] ajaxhook 加载失败');
    };
    (document.head || document.documentElement).appendChild(script);
  }

  // 注入拦截器
  function injectInterceptor() {
    if (isInjected) return;
    
    const script = document.createElement('script');
    script.textContent = `
(function() {
  // 注入服务器数据
  window.__SERVER_DATA__ = ${JSON.stringify(SERVER_DATA)};
  
  if (typeof ah === 'undefined') {
    console.error('[Interceptor] ajaxhook 未找到');
    return;
  }
  
  console.log('[Interceptor] 开始拦截...');
  
  // 设置拦截
  ah.proxy({
    onRequest: function(config, handler) {
      handler.next(config);
    },
    
    onResponse: function(response, handler) {
      try {
        const url = response.config.url;
        
        if (shouldIntercept(url)) {
          console.log('[Interceptor] 拦截:', url);
          
          const newData = buildResponse(url, window.__SERVER_DATA__);
          
          if (newData) {
            response.response = JSON.stringify(newData);
            console.log('[Interceptor] 已替换');
          }
        }
      } catch (error) {
        console.error('[Interceptor] 错误:', error);
      }
      
      handler.next(response);
    }
  });
  
  // 判断是否需要拦截
  function shouldIntercept(url) {
    const patterns = [
      '/rpc/OverviewService/',
      '/rpc/CampaignService/',
      '/rpc/AdGroupService/',
      '/rpc/AdGroupAdService/',
      'BatchService.Batch',
      '/rpc/KeywordView/',
      '/rpc/AgeService/',
      '/rpc/GenderService/',
      '/rpc/IncomeService/'
    ];
    
    return patterns.some(function(pattern) {
      return url.indexOf(pattern) !== -1;
    });
  }
  
  // 构建响应
  function buildResponse(url, data) {
    if (url.indexOf('OverviewService') !== -1) {
      return {
        success: true,
        data: {
          summary: data.accountCost,
          chart: data.accountCostChart
        }
      };
    }
    
    if (url.indexOf('CampaignService') !== -1) {
      return {
        success: true,
        data: {
          campaigns: data.campaignCost
        }
      };
    }
    
    if (url.indexOf('AdGroupService') !== -1) {
      return {
        success: true,
        data: {
          adGroups: data.adgroupCost
        }
      };
    }
    
    if (url.indexOf('AdGroupAdService') !== -1) {
      return {
        success: true,
        data: {
          ads: data.adCost
        }
      };
    }
    
    if (url.indexOf('BatchService') !== -1) {
      var responses = [];
      
      if (url.indexOf('CampaignService') !== -1) {
        responses.push(JSON.stringify({
          success: true,
          data: { campaigns: data.campaignCost }
        }));
      }
      
      if (url.indexOf('AdGroupService') !== -1) {
        responses.push(JSON.stringify({
          success: true,
          data: { adGroups: data.adgroupCost }
        }));
      }
      
      if (url.indexOf('AdGroupAdService') !== -1) {
        responses.push(JSON.stringify({
          success: true,
          data: { ads: data.adCost }
        }));
      }
      
      return {
        success: true,
        responses: responses
      };
    }
    
    return null;
  }
  
  console.log('[Interceptor] 拦截器已启动');
})();
    `;
    
    (document.head || document.documentElement).appendChild(script);
    isInjected = true;
    console.log('[Data Replacer] 拦截器已注入');
  }

  // 初始化
  function init() {
    injectAjaxHook(function() {
      setTimeout(injectInterceptor, 100);
    });
  }

  // 立即执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
