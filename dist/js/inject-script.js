// 注入到页面的脚本 - 拦截网络请求
// 这个脚本会在页面上下文中运行，可以拦截原生的 fetch 和 XMLHttpRequest

(function() {
  'use strict';

  console.log('[Google Ads Interceptor] 网络拦截脚本已加载');

  // 防止重复注入
  if (window.__googleAdsInterceptorInstalled) {
    console.log('[Google Ads Interceptor] 拦截器已安装，跳过');
    return;
  }
  window.__googleAdsInterceptorInstalled = true;

  // 存储配置
  let interceptorConfig = {
    adGroups: [],
    globalData: {},
    settings: {
      verbose: true,
      enableGlobalData: false
    }
  };

  // 监听来自 content script 的配置更新
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    
    if (event.data.type === 'UPDATE_INTERCEPTOR_CONFIG') {
      interceptorConfig = event.data.config;
      console.log('[Google Ads Interceptor] 配置已更新:', interceptorConfig);
    }
  });

  // ==================== Fetch 拦截 ====================
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource.url;

    // 调用原始 fetch
    const response = await originalFetch.apply(this, args);

    // 只处理 Google Ads 相关的请求
    if (!url || !shouldInterceptUrl(url)) {
      return response;
    }

    try {
      // 克隆响应以便读取
      const clonedResponse = response.clone();
      const contentType = clonedResponse.headers.get('content-type') || '';

      // 只处理 JSON 响应
      if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
        return response;
      }

      // 读取响应数据
      let data = await clonedResponse.json();
      
      if (interceptorConfig.settings.verbose) {
        console.log('[Google Ads Interceptor] 拦截到请求:', url);
        console.log('[Google Ads Interceptor] 原始数据:', JSON.parse(JSON.stringify(data)));
      }

      // 修改数据
      data = modifyResponseData(data, url);

      if (interceptorConfig.settings.verbose) {
        console.log('[Google Ads Interceptor] 修改后数据:', data);
      }

      // 创建新的响应对象
      const modifiedResponse = new Response(JSON.stringify(data), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      // 复制所有属性
      Object.defineProperty(modifiedResponse, 'url', { value: response.url });

      return modifiedResponse;

    } catch (error) {
      console.error('[Google Ads Interceptor] 处理响应时出错:', error);
      return response;
    }
  };

  console.log('[Google Ads Interceptor] Fetch 拦截器已安装');

  // ==================== XMLHttpRequest 拦截 ====================
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._interceptorUrl = url;
    this._interceptorMethod = method;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    if (!shouldInterceptUrl(this._interceptorUrl)) {
      return originalXHRSend.apply(this, args);
    }

    // 拦截响应
    const originalOnReadyStateChange = this.onreadystatechange;
    
    this.onreadystatechange = function() {
      if (this.readyState === 4 && this.status === 200) {
        try {
          const contentType = this.getResponseHeader('content-type') || '';
          if (contentType.includes('application/json') || contentType.includes('text/json')) {
            const originalResponse = this.responseText;
            let data = JSON.parse(originalResponse);

            if (interceptorConfig.settings.verbose) {
              console.log('[Google Ads Interceptor] XHR 拦截到请求:', this._interceptorUrl);
              console.log('[Google Ads Interceptor] 原始数据:', JSON.parse(JSON.stringify(data)));
            }

            data = modifyResponseData(data, this._interceptorUrl);

            if (interceptorConfig.settings.verbose) {
              console.log('[Google Ads Interceptor] 修改后数据:', data);
            }

            // 重写响应
            Object.defineProperty(this, 'responseText', {
              writable: true,
              value: JSON.stringify(data)
            });
            Object.defineProperty(this, 'response', {
              writable: true,
              value: JSON.stringify(data)
            });
          }
        } catch (error) {
          console.error('[Google Ads Interceptor] XHR 处理响应时出错:', error);
        }
      }
      
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.apply(this, arguments);
      }
    };

    return originalXHRSend.apply(this, args);
  };

  console.log('[Google Ads Interceptor] XMLHttpRequest 拦截器已安装');

  // ==================== 辅助函数 ====================

  /**
   * 判断是否需要拦截该 URL
   */
  function shouldInterceptUrl(url) {
    if (!url) return false;
    
    // Google Ads 相关的 API 请求
    const patterns = [
      '/api/',
      '/adgroups',
      '/campaigns',
      '/metrics',
      '/reporting',
      'google.com/aw/',
      'ads.google.com'
    ];

    return patterns.some(pattern => url.includes(pattern));
  }

  /**
   * 修改响应数据
   */
  function modifyResponseData(data, url) {
    if (!data) return data;

    // 深度克隆数据以避免修改原始对象
    const modifiedData = JSON.parse(JSON.stringify(data));

    try {
      // 处理不同的数据结构
      
      // 格式 1: 包含 rows 数组
      if (Array.isArray(modifiedData.rows)) {
        modifiedData.rows = modifiedData.rows.map(row => modifyRow(row));
      }

      // 格式 2: 直接是数组
      if (Array.isArray(modifiedData)) {
        return modifiedData.map(item => modifyRow(item));
      }

      // 格式 3: 包含 data 字段
      if (modifiedData.data) {
        if (Array.isArray(modifiedData.data)) {
          modifiedData.data = modifiedData.data.map(item => modifyRow(item));
        } else if (modifiedData.data.rows) {
          modifiedData.data.rows = modifiedData.data.rows.map(row => modifyRow(row));
        }
      }

      // 格式 4: 包含 results 字段
      if (modifiedData.results && Array.isArray(modifiedData.results)) {
        modifiedData.results = modifiedData.results.map(item => modifyRow(item));
      }

      // 格式 5: 嵌套的 adGroups 字段
      if (modifiedData.adGroups && Array.isArray(modifiedData.adGroups)) {
        modifiedData.adGroups = modifiedData.adGroups.map(item => modifyRow(item));
      }

      // 格式 6: 单个对象
      if (modifiedData.adGroup || modifiedData.metrics) {
        return modifyRow(modifiedData);
      }

    } catch (error) {
      console.error('[Google Ads Interceptor] 修改数据时出错:', error);
    }

    return modifiedData;
  }

  /**
   * 修改单行数据
   */
  function modifyRow(row) {
    if (!row) return row;

    // 提取广告组名称
    const adGroupName = extractAdGroupName(row);
    if (!adGroupName) return row;

    // 查找匹配的配置
    const matchedConfig = findMatchingConfig(adGroupName);
    
    let displayData = null;
    if (matchedConfig) {
      displayData = matchedConfig.displayData;
    } else if (interceptorConfig.settings.enableGlobalData) {
      displayData = interceptorConfig.globalData;
    }

    if (!displayData) return row;

    // 修改指标数据
    return applyDisplayData(row, displayData);
  }

  /**
   * 提取广告组名称
   */
  function extractAdGroupName(row) {
    // 尝试多种可能的字段名
    const nameFields = [
      'name',
      'adGroupName',
      'ad_group_name',
      'adGroup.name',
      'resourceName'
    ];

    for (const field of nameFields) {
      if (field.includes('.')) {
        const parts = field.split('.');
        let value = row;
        for (const part of parts) {
          value = value?.[part];
        }
        if (value) return String(value);
      } else {
        if (row[field]) return String(row[field]);
      }
    }

    // 如果有 adGroup 对象
    if (row.adGroup && row.adGroup.name) {
      return String(row.adGroup.name);
    }

    return null;
  }

  /**
   * 查找匹配的配置
   */
  function findMatchingConfig(adGroupName) {
    return interceptorConfig.adGroups.find(config => {
      if (config.match.name) {
        return config.match.name === adGroupName;
      }
      if (config.match.namePattern) {
        try {
          // 如果是正则表达式字符串，转换为正则对象
          let pattern = config.match.namePattern;
          if (typeof pattern === 'string') {
            // 提取正则表达式和标志
            const match = pattern.match(/^\/(.+)\/([gimsuy]*)$/);
            if (match) {
              pattern = new RegExp(match[1], match[2]);
            } else {
              pattern = new RegExp(pattern);
            }
          }
          return pattern.test(adGroupName);
        } catch (error) {
          console.error('[Google Ads Interceptor] 正则匹配出错:', error);
          return false;
        }
      }
      return false;
    });
  }

  /**
   * 应用显示数据
   */
  function applyDisplayData(row, displayData) {
    const modifiedRow = { ...row };

    // 处理 metrics 对象
    if (modifiedRow.metrics) {
      modifiedRow.metrics = { ...modifiedRow.metrics };
      
      if (displayData.impressions) {
        modifiedRow.metrics.impressions = parseNumber(displayData.impressions);
      }
      if (displayData.clicks) {
        modifiedRow.metrics.clicks = parseNumber(displayData.clicks);
      }
      if (displayData.conversions) {
        modifiedRow.metrics.conversions = parseNumber(displayData.conversions);
      }
      if (displayData.cost) {
        modifiedRow.metrics.cost_micros = parseCostToMicros(displayData.cost);
        modifiedRow.metrics.cost = parseFloat(displayData.cost.replace(/[^0-9.]/g, ''));
      }
      if (displayData.ctr) {
        modifiedRow.metrics.ctr = parsePercent(displayData.ctr);
      }
      if (displayData.cpc) {
        modifiedRow.metrics.average_cpc = parseFloat(displayData.cpc.replace(/[^0-9.]/g, ''));
      }
      if (displayData.conversionRate) {
        modifiedRow.metrics.conversion_rate = parsePercent(displayData.conversionRate);
      }
      if (displayData.cpa) {
        modifiedRow.metrics.cost_per_conversion = parseFloat(displayData.cpa.replace(/[^0-9.]/g, ''));
      }
    }

    // 处理直接在 row 上的字段
    if (displayData.impressions && modifiedRow.impressions !== undefined) {
      modifiedRow.impressions = parseNumber(displayData.impressions);
    }
    if (displayData.clicks && modifiedRow.clicks !== undefined) {
      modifiedRow.clicks = parseNumber(displayData.clicks);
    }
    if (displayData.conversions && modifiedRow.conversions !== undefined) {
      modifiedRow.conversions = parseNumber(displayData.conversions);
    }

    return modifiedRow;
  }

  /**
   * 解析数字（移除逗号）
   */
  function parseNumber(value) {
    if (typeof value === 'number') return value;
    return parseInt(String(value).replace(/,/g, ''), 10) || 0;
  }

  /**
   * 解析百分比
   */
  function parsePercent(value) {
    if (typeof value === 'number') return value;
    const num = parseFloat(String(value).replace(/%/g, ''));
    return num / 100; // Google Ads API 通常使用小数形式
  }

  /**
   * 将费用转换为微单位（Google Ads API 常用）
   */
  function parseCostToMicros(value) {
    const cost = parseFloat(String(value).replace(/[^0-9.]/g, ''));
    return Math.round(cost * 1000000); // 转换为微单位
  }

  console.log('[Google Ads Interceptor] 初始化完成');
})();
