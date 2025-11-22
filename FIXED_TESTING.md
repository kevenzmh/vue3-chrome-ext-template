# 修复后的测试步骤

## 问题已修复 ✅

之前的错误是因为 `ajaxhook.min.js` 文件不正确。现在已经使用了正确的文件。

## 完整测试步骤

### 1. 重新构建项目

```bash
cd D:\Projects\vue3-chrome-ext-template
npm run build
```

确认构建成功，没有错误。

### 2. 检查构建输出

确认 `dist` 目录包含以下文件：

```
dist/
├── manifest.json
├── js/
│   ├── background.js
│   ├── content.js
│   ├── popup.js
│   ├── options.js
│   └── inject-script.js
├── lib/
│   └── ajaxhook.min.js
├── popup.html
├── options.html
└── (其他文件)
```

### 3. 加载扩展

1. 打开 Chrome: `chrome://extensions/`
2. 启用"开发者模式"
3. 如果已加载旧版本，先点击"移除"
4. 点击"加载已解压的扩展程序"
5. 选择 `D:\Projects\vue3-chrome-ext-template\dist`

### 4. 访问 Google Ads

1. 访问 `https://ads.google.com`
2. 登录账号
3. 打开开发者工具 (F12)
4. 切换到 Console 标签

### 5. 验证加载成功

在控制台应该看到：

```
[Google Ads Modifier] Content Script 已加载
[Google Ads Modifier] 初始化中...
[Google Ads Modifier] 检测到 Google Ads 页面
[Google Ads Modifier] 配置加载完成: {...}
[Google Ads Modifier] ajaxhook 库注入成功
[Google Ads Modifier] 拦截脚本注入成功
[Google Ads Interceptor] 注入脚本开始加载...
[Google Ads Interceptor] ajax-hook 已就绪
[Google Ads Interceptor] 设置拦截器...
[Google Ads Interceptor] 拦截器已激活!
[Google Ads Interceptor] 加载完成! 可通过 window.__googleAdsInterceptor 访问
[Google Ads Modifier] 配置已发送到拦截器
```

### 6. 测试拦截器

在控制台输入：

```javascript
// 查看拦截器对象
window.__googleAdsInterceptor
```

应该返回：

```javascript
{
  config: {...},
  stats: {...},
  updateConfig: ƒ,
  getStats: ƒ,
  reset: ƒ
}
```

### 7. 查看统计信息

```javascript
window.__googleAdsInterceptor.stats
```

应该显示类似：

```javascript
{
  totalRequests: 10,
  interceptedRequests: 3,
  modifiedResponses: 0
}
```

### 8. 启用全局数据修改

```javascript
window.__googleAdsInterceptor.updateConfig({
  settings: {
    verbose: true,
    enableGlobalData: true
  }
})
```

然后刷新页面，观察控制台输出。

### 9. 测试广告组匹配

```javascript
// 添加一个测试规则
window.__googleAdsInterceptor.updateConfig({
  adGroups: [
    {
      match: { name: "测试广告组" },  // 替换为实际的广告组名称
      displayData: {
        impressions: "999999",
        clicks: "88888",
        cost: "12345.67"
      }
    }
  ]
})
```

刷新页面，查看该广告组的数据是否被修改。

## 常见问题排查

### 问题 1: 仍然显示 "ajax-hook 未加载"

**解决方法:**
1. 清除浏览器缓存
2. 完全移除扩展后重新加载
3. 确认 `dist/lib/ajaxhook.min.js` 文件存在且不为空

### 问题 2: 拦截器加载但 `__googleAdsInterceptor` 未定义

**解决方法:**
1. 检查是否有 JavaScript 错误
2. 确认 `inject-script.js` 正确执行
3. 在控制台运行：
```javascript
// 检查脚本是否注入
document.querySelector('script[src*="inject-script"]')
```

### 问题 3: 数据没有被修改

**可能原因:**
- `enableGlobalData` 未启用
- URL 匹配规则不正确
- 字段名称不匹配

**调试步骤:**
```javascript
// 1. 确认配置
console.log(window.__googleAdsInterceptor.config)

// 2. 启用详细日志
window.__googleAdsInterceptor.updateConfig({
  settings: { verbose: true, enableGlobalData: true }
})

// 3. 查看拦截统计
console.log(window.__googleAdsInterceptor.stats)

// 4. 刷新页面观察日志
location.reload()
```

## 调试技巧

### 查看网络请求

1. 打开 Network 标签
2. 筛选 XHR 请求
3. 查找包含这些关键词的请求：
   - `OverviewService`
   - `AdGroupService`
   - `BatchService`
   - `CampaignService`

### 手动测试拦截

```javascript
// 创建一个测试请求
var xhr = new XMLHttpRequest();
xhr.open('GET', '/rpc/OverviewService/Get?test=1', true);
xhr.onload = function() {
  console.log('响应:', xhr.responseText);
};
xhr.send();

// 查看统计是否增加
setTimeout(() => {
  console.log(window.__googleAdsInterceptor.stats);
}, 1000);
```

### 监控配置变化

```javascript
// 监听配置更新
let oldConfig = JSON.stringify(window.__googleAdsInterceptor.config);
setInterval(() => {
  let newConfig = JSON.stringify(window.__googleAdsInterceptor.config);
  if (oldConfig !== newConfig) {
    console.log('配置已更新:', window.__googleAdsInterceptor.config);
    oldConfig = newConfig;
  }
}, 1000);
```

## 与原项目对比

### 检查功能一致性

1. 加载原项目 (`D:\Projects\dist`)
2. 访问相同页面
3. 对比控制台输出
4. 对比拦截效果

### 性能对比

```javascript
// 新项目
console.time('interceptor');
location.reload();
setTimeout(() => {
  console.timeEnd('interceptor');
  console.log('统计:', window.__googleAdsInterceptor.stats);
}, 5000);
```

## 成功标志

当你看到以下内容时，说明一切正常：

1. ✅ 控制台没有红色错误
2. ✅ `window.__googleAdsInterceptor` 已定义
3. ✅ `stats.totalRequests` > 0
4. ✅ `stats.interceptedRequests` > 0
5. ✅ 页面顶部显示紫色横幅（5秒后消失）

## 下一步

如果一切正常，你可以：

1. **开发 UI 界面** - 编辑 `src/pages/popup/App.vue`
2. **添加更多规则** - 在 `inject-script.js` 中扩展匹配逻辑
3. **优化性能** - 减少不必要的遍历和日志
4. **添加持久化** - 使用 Chrome Storage 保存用户配置

## 完整测试脚本

复制以下代码到控制台运行完整测试：

```javascript
(async function fullTest() {
  console.log('%c=== Google Ads 拦截器完整测试 ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
  
  // 1. 检查拦截器
  if (!window.__googleAdsInterceptor) {
    console.error('❌ 拦截器未加载');
    return;
  }
  console.log('✅ 拦截器已加载');
  
  // 2. 显示当前配置
  console.log('📋 当前配置:', window.__googleAdsInterceptor.config);
  
  // 3. 显示统计
  console.log('📊 当前统计:', window.__googleAdsInterceptor.stats);
  
  // 4. 重置统计
  window.__googleAdsInterceptor.reset();
  console.log('🔄 统计已重置');
  
  // 5. 更新配置
  window.__googleAdsInterceptor.updateConfig({
    settings: {
      verbose: true,
      enableGlobalData: true
    },
    globalData: {
      impressions: "999999",
      clicks: "88888",
      cost: "77777.77"
    }
  });
  console.log('⚙️  配置已更新');
  
  // 6. 等待5秒后刷新
  console.log('⏳ 5秒后将刷新页面进行测试...');
  setTimeout(() => {
    location.reload();
  }, 5000);
  
  console.log('%c=== 测试准备完成 ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
})();
```
