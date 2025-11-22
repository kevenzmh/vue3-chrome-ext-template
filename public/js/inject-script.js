// Google Ads 概览页面专用拦截器
(function() {
  'use strict';

  console.clear();
  console.log('%c════════════════════════════════════════════', 'color: #00ff00; font-weight: bold;');
  console.log('%c  Google Ads 概览页面拦截器', 'color: #00ff00; font-weight: bold; font-size: 16px;');
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

    // 只拦截概览相关的 RPC 请求
    const isOverviewRequest = url && (
      url.includes('/rpc/OverviewService') ||
      url.includes('/_/rpc/') ||
      url.includes('/_/aw/')
    );

    // 排除无用请求
    const isExcluded = url && (
      url.includes('ipl_status') ||
      url.includes('heartbeat') ||
      url.includes('analytics') ||
      url.includes('gstatic')
    );

    if (!isOverviewRequest || isExcluded) {
      return originalFetch.apply(this, args);
    }

    stats.intercepted++;
    stats.interceptedUrls.push(url);

    console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800; font-weight: bold;');
    console.log('%c🎯 拦截到概览页面请求 #' + stats.intercepted, 'color: #ff9800; font-weight: bold; font-size: 14px;');
    console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800; font-weight: bold;');
    console.log('🔗 URL:', url);

    try {
      const response = await originalFetch.apply(this, args);

      // 处理空响应
      if (!response.ok || response.status === 204) {
        console.log('⚠️  响应状态异常:', response.status);
        console.log('%c═══════════════════════════════════════════════════════', 'color: #ff9800;');
        return response;
      }

      const clone = response.clone();
      const text = await clone.text();

      console.log('✅ 响应状态:', response.status);
      console.log('📦 响应长度:', text.length, 'bytes');
      console.log('📄 响应前800字符:');
      console.log(text.substring(0, 800));
      console.log('');

      // 修改数据
      const modifiedText = modifyOverviewData(text, url);

      if (modifiedText !== text) {
        stats.modified++;
        console.log('%c✨✨✨ 数据修改成功！✨✨✨', 'color: #4caf50; font-weight: bold; font-size: 16px;');
        console.log('');
        console.log('📊 修改后的数据:');
        console.log('  点击次数:', virtualData.clicks);
        console.log('  展示次数:', virtualData.impressions);
        console.log('  平均CPC:', virtualData.averageCpc);
        console.log('  费用:', virtualData.cost);
        console.log('');
        console.log('修改后响应前800字符:');
        console.log(modifiedText.substring(0, 800));
      } else {
        console.log('%c⚠️  数据未修改（未找到匹配字段）', 'color: #ff9800; font-weight: bold;');
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

  function modifyOverviewData(text, url) {
    console.log('🔄 开始修改概览数据...');

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
      } else if (typeof data === 'object') {
        console.log('  对象键:', Object.keys(data));
      }

      // 深度修改
      const modifiedData = deepModify(data, '');

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

  function deepModify(data, path) {
    if (data == null) return data;

    // 数组
    if (Array.isArray(data)) {
      return data.map((item, index) => deepModify(item, `${path}[${index}]`));
    }

    // 对象
    if (typeof data === 'object') {
      const result = {};

      for (const key in data) {
        const value = data[key];
        const currentPath = path ? `${path}.${key}` : key;
        const keyLower = String(key).toLowerCase();

        // 检查是否是数字类型的字段
        const isNumeric = typeof value === 'number' || 
                         (typeof value === 'string' && /^\d+(\.\d+)?$/.test(String(value).trim()));

        if (isNumeric) {
          // 点击次数
          if (keyLower.includes('click') && !keyLower.includes('rate') && !keyLower.includes('cpc')) {
            result[key] = virtualData.clicks;
            console.log(`  🔧 修改 ${currentPath}: ${value} → ${virtualData.clicks} (点击次数)`);
            continue;
          }

          // 展示次数
          if (keyLower.includes('impr') || keyLower.includes('impression')) {
            result[key] = virtualData.impressions;
            console.log(`  🔧 修改 ${currentPath}: ${value} → ${virtualData.impressions} (展示次数)`);
            continue;
          }

          // 平均每次点击费用
          if (keyLower.includes('cpc') || keyLower.includes('avgcpc') || 
              (keyLower.includes('average') && keyLower.includes('cpc'))) {
            result[key] = virtualData.averageCpc;
            console.log(`  🔧 修改 ${currentPath}: ${value} → ${virtualData.averageCpc} (平均CPC)`);
            continue;
          }

          // 费用（可能是微单位 micros）
          if (keyLower.includes('cost') || keyLower.includes('spend')) {
            // 如果原值很大（>100000），说明是微单位（1元 = 1000000微单位）
            if (typeof value === 'number' && value > 100000) {
              const microCost = Math.round(virtualData.cost * 1000000);
              result[key] = microCost;
              console.log(`  🔧 修改 ${currentPath}: ${value} → ${microCost} (费用-微单位)`);
            } else {
              result[key] = virtualData.cost;
              console.log(`  🔧 修改 ${currentPath}: ${value} → ${virtualData.cost} (费用)`);
            }
            continue;
          }
        }

        // 递归处理
        result[key] = deepModify(value, currentPath);
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

    const replacements = [
      { 
        name: '点击次数', 
        pattern: /"clicks?"\s*:\s*(\d+)/gi, 
        value: virtualData.clicks 
      },
      { 
        name: '展示次数', 
        pattern: /"impressions?"\s*:\s*(\d+)/gi, 
        value: virtualData.impressions 
      },
      { 
        name: '平均CPC', 
        pattern: /"(average_?cpc|avg_?cpc)"\s*:\s*(\d+\.?\d*)/gi, 
        value: virtualData.averageCpc 
      },
      { 
        name: '费用', 
        pattern: /"(cost|spend)"\s*:\s*(\d+\.?\d*)/gi, 
        value: virtualData.cost 
      }
    ];

    replacements.forEach(({ name, pattern, value }) => {
      const before = result;
      result = result.replace(pattern, (match, ...args) => {
        changeCount++;
        const num = args[args.length - 3]; // 获取捕获的数字
        return match.replace(num, value);
      });

      if (result !== before) {
        console.log(`  ✓ 替换了 ${name}`);
      }
    });

    console.log(`  共修改 ${changeCount} 个字段`);
    return result;
  }

  // ==================== 公共接口 ====================

  window.__overviewInterceptor = {
    _originalFetch: originalFetch,

    // 查看统计
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
          console.log(`  ${i + 1}. ${url.substring(0, 100)}...`);
        });
      }
      console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9c27b0; font-weight: bold;');
    },

    // 查看当前设置的虚拟数据
    getData: function() {
      console.log('当前虚拟数据:', virtualData);
    },

    // 修改虚拟数据
    setData: function(newData) {
      Object.assign(virtualData, newData);
      console.log('✅ 虚拟数据已更新:', virtualData);
      console.log('💡 刷新页面以应用新数据');
    },

    // 卸载拦截器
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
  console.log('%c💡 使用方法:', 'color: #00bfff; font-weight: bold;');
  console.log('  __overviewInterceptor.stats()     - 查看统计');
  console.log('  __overviewInterceptor.getData()   - 查看当前数据');
  console.log('  __overviewInterceptor.setData({clicks: 99999})  - 修改数据');
  console.log('');
  console.log('%c🔔 现在请刷新概览页面，或切换到概览页面！', 'color: #ff9800; font-weight: bold; font-size: 14px;');
  console.log('%c════════════════════════════════════════════', 'color: #00ff00; font-weight: bold;');

})();
