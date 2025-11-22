// Google Ads OverviewService 精确拦截器
(function() {
  'use strict';

  console.clear();
  console.log('%c════════════════════════════════════════════', 'color: #00ff00; font-weight: bold;');
  console.log('%c  OverviewService 拦截器 v2.0', 'color: #00ff00; font-weight: bold; font-size: 16px;');
  console.log('%c════════════════════════════════════════════', 'color: #00ff00; font-weight: bold;');

  if (window.__overviewInterceptor) {
    console.log('⚠️  已存在拦截器，先卸载...');
    window.fetch = window.__overviewInterceptor._originalFetch;
  }

  // 虚拟数据配置
  const virtualData = {
    clicks: 88888,           // 点击次数
    impressions: 999999,     // 展示次数
    averageCpc: 0.75,        // 平均每次点击费用（元）
    cost: 66666.00           // 费用（元）
  };

  // 统计
  const stats = {
    total: 0,
    intercepted: 0,
    modified: 0,
    interceptedUrls: []
  };

  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    stats.total++;

    // 精确匹配 OverviewService/Get
    const isTargetRequest = url && url.includes('/rpc/OverviewService/Get');

    if (!isTargetRequest) {
      return originalFetch.apply(this, args);
    }

    stats.intercepted++;
    stats.interceptedUrls.push(url);

    console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800; font-weight: bold;');
    console.log('%c🎯 拦截到 OverviewService 请求！', 'color: #ff9800; font-weight: bold; font-size: 16px;');
    console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800; font-weight: bold;');
    console.log('🔗 URL:', url);
    console.log('📅 时间:', new Date().toLocaleTimeString());

    try {
      const response = await originalFetch.apply(this, args);

      if (!response.ok) {
        console.log('⚠️  响应状态异常:', response.status);
        console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800;');
        return response;
      }

      const clone = response.clone();
      const text = await clone.text();

      console.log('✅ 响应状态:', response.status);
      console.log('📦 响应长度:', text.length, 'bytes');
      console.log('📄 响应前1000字符:');
      console.log(text.substring(0, 1000));
      console.log('...');
      console.log('');

      // 修改数据
      const modifiedText = modifyOverviewData(text);

      if (modifiedText !== text) {
        stats.modified++;
        console.log('%c═══════════════════════════════════════════════════════', 'color: #4caf50; font-weight: bold;');
        console.log('%c✨✨✨ 数据修改成功！✨✨✨', 'color: #4caf50; font-weight: bold; font-size: 18px;');
        console.log('%c═══════════════════════════════════════════════════════', 'color: #4caf50; font-weight: bold;');
        console.log('');
        console.log('📊 修改后的数据:');
        console.log('  ✅ 点击次数:', virtualData.clicks);
        console.log('  ✅ 展示次数:', virtualData.impressions);
        console.log('  ✅ 平均CPC:', virtualData.averageCpc, '元');
        console.log('  ✅ 费用:', virtualData.cost, '元');
        console.log('');
        console.log('📄 修改后响应前1000字符:');
        console.log(modifiedText.substring(0, 1000));
        console.log('...');
      } else {
        console.log('%c⚠️  数据未修改（未找到匹配字段）', 'color: #ff9800; font-weight: bold;');
        console.log('这可能是因为字段名称不匹配，请查看上面的原始响应');
      }

      console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800; font-weight: bold;');
      console.log('');

      return new Response(modifiedText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (error) {
      console.error('❌ 处理请求时出错:', error);
      console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800;');
      return originalFetch.apply(this, args);
    }
  };

  // ==================== 数据修改函数 ====================

  function modifyOverviewData(text) {
    console.log('🔄 开始分析和修改数据...');

    // 处理 Google RPC 前缀
    let jsonText = text;
    let hasPrefix = false;

    if (text.startsWith(")]}'\n")) {
      jsonText = text.substring(5);
      hasPrefix = true;
      console.log('  ✓ 检测到 Google RPC 安全前缀');
    }

    // 尝试 JSON 解析
    try {
      const data = JSON.parse(jsonText);
      console.log('  ✓ JSON 解析成功');
      console.log('  数据类型:', Array.isArray(data) ? '数组' : typeof data);

      if (Array.isArray(data)) {
        console.log('  数组长度:', data.length);
        // 打印数组结构
        data.forEach((item, i) => {
          if (i < 3) { // 只打印前3项
            console.log(`  [${i}]:`, typeof item, Array.isArray(item) ? `数组(${item.length})` : '');
          }
        });
      } else if (typeof data === 'object' && data !== null) {
        console.log('  对象键:', Object.keys(data));
      }

      // 深度修改
      const modifiedData = deepModify(data, '', 0);

      // 序列化
      let result = JSON.stringify(modifiedData);
      if (hasPrefix) {
        result = ")]}'\n" + result;
      }

      return result;

    } catch (error) {
      console.log('  ✗ JSON 解析失败:', error.message);
      console.log('  使用正则表达式修改...');
      return regexModify(text);
    }
  }

  function deepModify(data, path, depth) {
    // 防止递归太深
    if (depth > 10) return data;
    if (data == null) return data;

    // 数组
    if (Array.isArray(data)) {
      return data.map((item, index) => deepModify(item, `${path}[${index}]`, depth + 1));
    }

    // 对象
    if (typeof data === 'object') {
      const result = {};

      for (const key in data) {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        const keyLower = String(key).toLowerCase();

        // 检查是否是数字类型
        const isNumeric = typeof value === 'number' || 
                         (typeof value === 'string' && /^\d+(\.\d+)?$/.test(String(value).trim()));

        if (isNumeric) {
          let modified = false;
          let newValue = value;

          // 点击次数 - 各种可能的字段名
          if (keyLower.match(/^clicks?$/) || 
              keyLower === 'click' ||
              keyLower === 'clickcount' ||
              keyLower === 'numclicks') {
            newValue = virtualData.clicks;
            modified = true;
            console.log(`  🔧 [点击] ${currentPath}: ${value} → ${newValue}`);
          }
          
          // 展示次数
          else if (keyLower.match(/^impr(essions?)?$/) || 
                   keyLower === 'impression' ||
                   keyLower === 'impressioncount' ||
                   keyLower === 'numimpressions' ||
                   keyLower === 'views') {
            newValue = virtualData.impressions;
            modified = true;
            console.log(`  🔧 [展示] ${currentPath}: ${value} → ${newValue}`);
          }
          
          // 平均CPC
          else if (keyLower.includes('cpc') || 
                   keyLower.includes('avgcpc') ||
                   keyLower === 'averagecpc' ||
                   keyLower === 'avg_cpc' ||
                   (keyLower.includes('average') && keyLower.includes('cost') && keyLower.includes('click'))) {
            newValue = virtualData.averageCpc;
            modified = true;
            console.log(`  🔧 [平均CPC] ${currentPath}: ${value} → ${newValue}`);
          }
          
          // 费用
          else if (keyLower.match(/^cost$/) || 
                   keyLower === 'totalcost' ||
                   keyLower === 'spend' ||
                   keyLower === 'amount' ||
                   keyLower === 'costmicros' ||
                   keyLower === 'cost_micros') {
            // Google Ads API 通常使用微单位 (1元 = 1,000,000 micros)
            if (typeof value === 'number' && value > 100000) {
              newValue = Math.round(virtualData.cost * 1000000);
              console.log(`  🔧 [费用-微单位] ${currentPath}: ${value} → ${newValue}`);
            } else {
              newValue = virtualData.cost;
              console.log(`  🔧 [费用] ${currentPath}: ${value} → ${newValue}`);
            }
            modified = true;
          }

          if (modified) {
            result[key] = newValue;
            continue;
          }
        }

        // 递归处理
        result[key] = deepModify(value, currentPath, depth + 1);
      }

      return result;
    }

    // 原始值
    return data;
  }

  function regexModify(text) {
    console.log('  使用正则表达式替换...');
    let result = text;
    let changeCount = 0;

    // 更宽松的正则模式
    const patterns = [
      { name: '点击', regex: /"clicks?"\s*:\s*"?(\d+)"?/gi, value: virtualData.clicks },
      { name: '展示', regex: /"impressions?"\s*:\s*"?(\d+)"?/gi, value: virtualData.impressions },
      { name: 'CPC', regex: /"(avg_?cpc|average_?cpc|cpc)"\s*:\s*"?(\d+\.?\d*)"?/gi, value: virtualData.averageCpc },
      { name: '费用', regex: /"(cost|spend|totalcost)"\s*:\s*"?(\d+\.?\d*)"?/gi, value: virtualData.cost }
    ];

    patterns.forEach(({ name, regex, value }) => {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        console.log(`  找到 ${matches.length} 个 ${name} 字段`);
        result = result.replace(regex, (match) => {
          changeCount++;
          return match.replace(/\d+\.?\d*/, value);
        });
      }
    });

    if (changeCount > 0) {
      console.log(`  ✓ 通过正则修改了 ${changeCount} 个字段`);
    } else {
      console.log(`  ✗ 未找到可替换的字段`);
    }

    return result;
  }

  // ==================== 公共接口 ====================

  window.__overviewInterceptor = {
    _originalFetch: originalFetch,

    stats: function() {
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0; font-weight: bold;');
      console.log('%c📊 拦截器统计', 'color: #9c27b0; font-weight: bold; font-size: 14px;');
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0; font-weight: bold;');
      console.log('总请求数:', stats.total);
      console.log('拦截数:', stats.intercepted);
      console.log('修改数:', stats.modified);
      console.log('成功率:', stats.intercepted > 0 ? ((stats.modified / stats.intercepted * 100).toFixed(2) + '%') : 'N/A');
      
      if (stats.interceptedUrls.length > 0) {
        console.log('\n拦截的 URL:');
        stats.interceptedUrls.forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`);
        });
      } else {
        console.log('\n暂未拦截到任何请求');
        console.log('💡 请刷新概览页面以触发数据加载');
      }
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0; font-weight: bold;');
    },

    getData: function() {
      console.log('当前虚拟数据:', virtualData);
    },

    setData: function(newData) {
      Object.assign(virtualData, newData);
      console.log('✅ 虚拟数据已更新:', virtualData);
      console.log('💡 刷新页面以应用新数据');
    },

    uninstall: function() {
      window.fetch = originalFetch;
      console.log('🗑️  拦截器已卸载');
    }
  };

  console.log('%c✅ 拦截器安装成功！', 'color: #4caf50; font-weight: bold; font-size: 14px;');
  console.log('');
  console.log('📊 虚拟数据设置:');
  console.log('  点击次数:', virtualData.clicks);
  console.log('  展示次数:', virtualData.impressions);
  console.log('  平均CPC:', virtualData.averageCpc, '元');
  console.log('  费用:', virtualData.cost, '元');
  console.log('');
  console.log('%c💡 目标 API:', 'color: #00bfff; font-weight: bold;');
  console.log('  /rpc/OverviewService/Get');
  console.log('');
  console.log('%c🔔 现在请刷新概览页面！', 'color: #ff9800; font-weight: bold; font-size: 14px;');
  console.log('%c════════════════════════════════════════════', 'color: #00ff00; font-weight: bold;');

})();
