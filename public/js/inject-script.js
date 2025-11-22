// 完整网络监控脚本 - 在控制台运行
// 用于分析 Google Ads 的真实 API 调用

(function() {
  console.log('%c=== 🔍 网络监控开始 ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
  console.log('此脚本会记录所有网络请求的详细信息');
  console.log('请在 Google Ads 页面刷新或导航到广告组列表页面');
  console.log('---');

  const allRequests = [];
  const jsonRequests = [];

  // 拦截 Fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [resource, config] = args;
    const url = typeof resource === 'string' ? resource : resource.url;
    const method = config?.method || 'GET';
    
    const requestInfo = {
      type: 'fetch',
      url: url,
      method: method,
      timestamp: new Date().toISOString(),
      time: Date.now()
    };

    try {
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      
      requestInfo.status = response.status;
      requestInfo.contentType = clonedResponse.headers.get('content-type') || 'unknown';
      
      // 如果是 JSON，尝试读取内容
      if (requestInfo.contentType.includes('json')) {
        try {
          const data = await clonedResponse.json();
          requestInfo.responseData = data;
          requestInfo.responsePreview = JSON.stringify(data).substring(0, 200);
          
          jsonRequests.push(requestInfo);
          
          // 详细记录 JSON 请求
          console.log('%c[Network Monitor] 📡 JSON 请求', 'color: #2196f3; font-weight: bold;');
          console.log('  URL:', url);
          console.log('  Method:', method);
          console.log('  Status:', response.status);
          console.log('  响应数据:', data);
          console.log('  ---');
        } catch (e) {
          requestInfo.error = 'JSON解析失败';
        }
      }
      
      allRequests.push(requestInfo);
      return response;
      
    } catch (error) {
      requestInfo.error = error.message;
      allRequests.push(requestInfo);
      throw error;
    }
  };

  // 拦截 XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._monitorUrl = url;
    this._monitorMethod = method;
    this._monitorTime = Date.now();
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    const self = this;
    
    const originalOnReadyStateChange = this.onreadystatechange;
    this.onreadystatechange = function() {
      if (this.readyState === 4) {
        const requestInfo = {
          type: 'xhr',
          url: self._monitorUrl,
          method: self._monitorMethod,
          status: this.status,
          timestamp: new Date().toISOString(),
          time: self._monitorTime,
          contentType: this.getResponseHeader('content-type') || 'unknown'
        };

        // 如果是 JSON
        if (requestInfo.contentType.includes('json')) {
          try {
            const data = JSON.parse(this.responseText);
            requestInfo.responseData = data;
            requestInfo.responsePreview = JSON.stringify(data).substring(0, 200);
            
            jsonRequests.push(requestInfo);
            
            console.log('%c[Network Monitor] 📡 XHR JSON 请求', 'color: #ff9800; font-weight: bold;');
            console.log('  URL:', self._monitorUrl);
            console.log('  Method:', self._monitorMethod);
            console.log('  Status:', this.status);
            console.log('  响应数据:', data);
            console.log('  ---');
          } catch (e) {
            requestInfo.error = 'JSON解析失败';
          }
        }
        
        allRequests.push(requestInfo);
      }
      
      if (originalOnReadyStateChange) {
        originalOnReadyStateChange.apply(this, arguments);
      }
    };
    
    return originalXHRSend.apply(this, args);
  };

  console.log('✅ 网络监控已激活');
  console.log('---');

  // 添加全局方法
  window.__networkMonitor = {
    // 获取所有请求
    getAllRequests: () => {
      console.log(`总共捕获 ${allRequests.length} 个请求`);
      return allRequests;
    },
    
    // 获取所有 JSON 请求
    getJsonRequests: () => {
      console.log(`捕获 ${jsonRequests.length} 个 JSON 请求`);
      return jsonRequests;
    },
    
    // 搜索包含特定关键词的请求
    search: (keyword) => {
      const results = allRequests.filter(req => 
        req.url.toLowerCase().includes(keyword.toLowerCase())
      );
      console.log(`找到 ${results.length} 个包含 "${keyword}" 的请求`);
      results.forEach(req => {
        console.log(`  ${req.method} ${req.url}`);
        if (req.responseData) {
          console.log('    响应:', req.responseData);
        }
      });
      return results;
    },
    
    // 查找可能包含广告组数据的请求
    findAdGroupRequests: () => {
      console.log('%c=== 🔍 查找广告组相关请求 ===', 'color: #4caf50; font-size: 14px; font-weight: bold;');
      
      const keywords = [
        'adgroup', 'ad_group', 'campaign', 'metric', 
        'impression', 'click', 'conversion', 'cost',
        'row', 'data', 'report', 'table'
      ];
      
      const potentialRequests = jsonRequests.filter(req => {
        const dataStr = JSON.stringify(req.responseData).toLowerCase();
        return keywords.some(keyword => dataStr.includes(keyword));
      });
      
      console.log(`找到 ${potentialRequests.length} 个可能的广告组数据请求`);
      
      potentialRequests.forEach((req, index) => {
        console.log(`\n--- 请求 #${index + 1} ---`);
        console.log('URL:', req.url);
        console.log('响应数据结构:', Object.keys(req.responseData));
        console.log('完整数据:', req.responseData);
      });
      
      return potentialRequests;
    },
    
    // 分析所有 JSON 响应的数据结构
    analyzeStructures: () => {
      console.log('%c=== 📊 数据结构分析 ===', 'color: #9c27b0; font-size: 14px; font-weight: bold;');
      
      const structures = new Map();
      
      jsonRequests.forEach(req => {
        if (req.responseData && typeof req.responseData === 'object') {
          const keys = Object.keys(req.responseData).sort().join(', ');
          if (!structures.has(keys)) {
            structures.set(keys, {
              count: 0,
              example: req,
              urls: []
            });
          }
          const struct = structures.get(keys);
          struct.count++;
          struct.urls.push(req.url);
        }
      });
      
      structures.forEach((struct, keys) => {
        console.log(`\n结构: { ${keys} }`);
        console.log(`  出现次数: ${struct.count}`);
        console.log(`  示例 URL: ${struct.urls[0]}`);
        console.log(`  示例数据:`, struct.example.responseData);
      });
      
      return structures;
    },
    
    // 打印帮助
    help: () => {
      console.log('%c=== 📖 网络监控器使用方法 ===', 'color: #00bfff; font-size: 14px; font-weight: bold;');
      console.log('');
      console.log('window.__networkMonitor.getAllRequests()     - 获取所有请求');
      console.log('window.__networkMonitor.getJsonRequests()    - 获取所有 JSON 请求');
      console.log('window.__networkMonitor.search("keyword")    - 搜索包含关键词的请求');
      console.log('window.__networkMonitor.findAdGroupRequests() - 查找广告组数据请求');
      console.log('window.__networkMonitor.analyzeStructures()  - 分析数据结构');
      console.log('');
      console.log('%c建议操作流程:', 'color: #ff9800; font-weight: bold;');
      console.log('1. 在 Google Ads 中导航到广告组列表页面');
      console.log('2. 运行: window.__networkMonitor.findAdGroupRequests()');
      console.log('3. 查看输出的请求和数据结构');
      console.log('4. 根据实际数据结构调整拦截器代码');
    }
  };

  // 自动显示帮助
  setTimeout(() => {
    window.__networkMonitor.help();
  }, 1000);

  // 定期提醒
  setInterval(() => {
    console.log(`%c[Network Monitor] 已捕获 ${allRequests.length} 个请求，${jsonRequests.length} 个 JSON 请求`, 'color: #999;');
  }, 15000);

})();