# 快速测试指南

## 1. 构建项目

```bash
cd D:\Projects\vue3-chrome-ext-template
npm run build
```

## 2. 加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击左上角的"加载已解压的扩展程序"
5. 选择 `D:\Projects\vue3-chrome-ext-template\dist` 目录
6. 确认扩展已成功加载

## 3. 访问 Google Ads

1. 访问 `https://ads.google.com`
2. 登录你的账号
3. 进入任意广告系列或广告组页面

## 4. 验证拦截器是否工作

### 方法 1: 查看控制台日志
1. 按 `F12` 打开开发者工具
2. 切换到 Console 标签
3. 应该能看到以下日志:
   ```
   [Google Ads Modifier] Content Script 已加载
   [Google Ads Modifier] 检测到 Google Ads 页面
   [Google Ads Modifier] ajaxhook 库注入成功
   [Google Ads Modifier] 拦截脚本注入成功
   [Google Ads Interceptor] 注入脚本加载完成!
   ```

### 方法 2: 检查拦截统计
在控制台中输入:
```javascript
window.__googleAdsInterceptor.stats
```

应该能看到类似的输出:
```javascript
{
  totalRequests: 45,
  interceptedRequests: 8,
  modifiedResponses: 3
}
```

### 方法 3: 查看页面横幅
页面顶部应该会短暂显示一个紫色横幅:
```
🔧 Google Ads 数据修改器 网络拦截已激活
```

## 5. 测试数据修改

### 启用全局数据修改
1. 在控制台中输入:
```javascript
window.__googleAdsInterceptor.updateConfig({
  settings: {
    verbose: true,
    enableGlobalData: true
  }
});
```

2. 刷新页面
3. 观察控制台,应该能看到数据修改的日志:
```
[Modify] data.clicks = 3000
[Modify] data.impressions = 50000
[Modify] data.cost = 840.00
```

### 测试广告组匹配
1. 找到一个广告组的名称
2. 更新配置:
```javascript
window.__googleAdsInterceptor.updateConfig({
  adGroups: [
    {
      match: { name: "你的广告组名称" },
      displayData: {
        impressions: "999999",
        clicks: "88888",
        cost: "12345.67"
      }
    }
  ]
});
```

3. 刷新页面
4. 该广告组的数据应该被修改

## 6. 调试技巧

### 查看完整配置
```javascript
window.__googleAdsInterceptor.config
```

### 查看拦截的请求
```javascript
// 启用详细日志
window.__googleAdsInterceptor.updateConfig({
  settings: { verbose: true }
});
```

### 重置统计
```javascript
window.__googleAdsInterceptor.reset()
```

### 手动发送配置
如果配置没有正确传递,可以在 Content Script 的上下文中手动发送:
```javascript
window.googleAdsInterceptor.updateInterceptorConfig()
```

## 7. 常见问题排查

### 问题 1: 看不到任何日志
**可能原因**: 脚本注入失败
**解决方法**:
1. 检查 `manifest.json` 中的 `web_accessible_resources` 配置
2. 确认 `ajaxhook.min.js` 和 `inject-script.js` 文件存在于 `dist` 目录
3. 重新加载扩展

### 问题 2: 拦截器加载但数据没有修改
**可能原因**: 配置问题或 URL 匹配规则不正确
**解决方法**:
1. 检查 `window.__googleAdsInterceptor.stats`
2. 如果 `interceptedRequests` 为 0,说明 URL 匹配规则需要调整
3. 启用 `verbose` 模式查看详细日志

### 问题 3: 页面加载很慢
**可能原因**: 拦截器处理逻辑耗时过长
**解决方法**:
1. 简化数据修改逻辑
2. 减少配置规则数量
3. 禁用 `verbose` 模式

### 问题 4: 扩展无法加载
**可能原因**: manifest.json 配置错误
**解决方法**:
1. 检查 JSON 格式是否正确
2. 确认所有权限都已声明
3. 查看 Chrome 扩展页面的错误信息

## 8. 性能测试

### 测试拦截性能
```javascript
// 记录开始时间
const start = performance.now();

// 触发一些 API 请求 (刷新页面)
location.reload();

// 等待请求完成后,在控制台查看统计
setTimeout(() => {
  const end = performance.now();
  const stats = window.__googleAdsInterceptor.stats;
  console.log('性能统计:');
  console.log('  总请求数:', stats.totalRequests);
  console.log('  拦截请求数:', stats.interceptedRequests);
  console.log('  修改响应数:', stats.modifiedResponses);
  console.log('  耗时:', (end - start).toFixed(2), 'ms');
}, 5000);
```

## 9. 对比原项目

### 检查功能一致性
1. 使用原项目 (`D:\Projects\dist`) 加载扩展
2. 访问相同的 Google Ads 页面
3. 对比两个版本的拦截效果
4. 确认新项目的功能完整性

### 性能对比
```javascript
// 在原项目中
console.log('原项目统计:', window.__CONTENT_SCRIPT_MANAGER__);

// 在新项目中
console.log('新项目统计:', window.__googleAdsInterceptor.stats);
```

## 10. 下一步开发

### 添加 UI 配置界面
1. 编辑 `src/pages/popup/App.vue`
2. 添加表单控件来配置拦截规则
3. 实现配置的保存和加载

### 添加更多拦截规则
1. 分析 Google Ads 的其他 API 端点
2. 在 `inject-script.js` 中添加新的 URL 匹配规则
3. 实现对应的数据修改逻辑

### 优化用户体验
1. 添加成功/失败提示
2. 显示实时拦截统计
3. 提供一键启用/禁用功能

---

## 附录: 完整测试脚本

在控制台中运行此脚本进行全面测试:

```javascript
// Google Ads 拦截器测试脚本
(async function testInterceptor() {
  console.log('=== 开始测试 Google Ads 拦截器 ===');
  
  // 1. 检查拦截器是否加载
  if (!window.__googleAdsInterceptor) {
    console.error('❌ 拦截器未加载!');
    return;
  }
  console.log('✅ 拦截器已加载');
  
  // 2. 检查配置
  const config = window.__googleAdsInterceptor.config;
  console.log('✅ 配置:', config);
  
  // 3. 检查统计
  const stats = window.__googleAdsInterceptor.stats;
  console.log('✅ 统计:', stats);
  
  // 4. 测试配置更新
  window.__googleAdsInterceptor.updateConfig({
    settings: { verbose: true, enableGlobalData: true }
  });
  console.log('✅ 配置更新成功');
  
  // 5. 刷新页面进行实际测试
  console.log('⏳ 5秒后将刷新页面进行实际测试...');
  setTimeout(() => {
    location.reload();
  }, 5000);
  
  console.log('=== 测试脚本执行完成 ===');
})();
```
