# Google Ads 数据拦截修改器 - 实现说明

## 技术栈对比

### 原项目 (D:\Projects\dist)
- **核心技术**: ajax-hook 库
- **拦截方式**: XMLHttpRequest 劫持
- **运行方式**: 直接在页面上下文中运行
- **特点**: 可以拦截所有 XMLHttpRequest 请求

### 新项目 (vue3-chrome-ext-template)
- **核心技术**: ajax-hook 库 (与原项目相同)
- **拦截方式**: XMLHttpRequest 劫持 (与原项目相同)
- **运行方式**: Chrome Extension + 脚本注入
- **特点**: 更灵活的配置管理,更好的用户界面

## 实现原理

### 1. 文件结构
```
vue3-chrome-ext-template/
├── manifest.json                    # Chrome 扩展配置
├── public/
│   ├── js/
│   │   └── inject-script.js        # 注入到页面的拦截脚本
│   └── lib/
│       └── ajaxhook.min.js         # ajax-hook 核心库
├── src/
│   └── pages/
│       ├── content/
│       │   └── main.js             # Content Script (桥接层)
│       ├── background/
│       │   └── main.js             # Background Script
│       └── popup/
│           └── App.vue             # 弹窗界面
└── vue.config.js                    # 构建配置
```

### 2. 工作流程

#### 步骤 1: Content Script 加载
- 当用户访问 `ads.google.com` 时,Chrome 自动注入 `content.js`
- Content Script 运行在一个隔离的环境中,无法直接访问页面的 JavaScript 上下文

#### 步骤 2: 注入 ajax-hook 库
```javascript
// content.js 中
const ajaxhookScript = document.createElement('script');
ajaxhookScript.src = chrome.runtime.getURL('lib/ajaxhook.min.js');
document.head.appendChild(ajaxhookScript);
```

#### 步骤 3: 注入拦截脚本
```javascript
// 等 ajaxhook 加载完成后
ajaxhookScript.onload = () => {
  const interceptorScript = document.createElement('script');
  interceptorScript.src = chrome.runtime.getURL('js/inject-script.js');
  document.head.appendChild(interceptorScript);
};
```

#### 步骤 4: 设置 AJAX 拦截
```javascript
// inject-script.js 中
window.ah.proxy({
  onRequest: (config, handler) => {
    // 请求拦截 - 可以修改请求参数
    handler.next(config);
  },
  onResponse: (response, handler) => {
    // 响应拦截 - 修改返回的数据
    if (isTargetRequest(response.config)) {
      response.response = modifyResponseData(response.response);
    }
    handler.next(response);
  }
});
```

#### 步骤 5: 配置通信
```javascript
// content.js 发送配置到页面
window.postMessage({
  type: 'UPDATE_INTERCEPTOR_CONFIG',
  config: this.config
}, '*');

// inject-script.js 接收配置
window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_INTERCEPTOR_CONFIG') {
    config = event.data.config;
  }
});
```

### 3. 关键代码解析

#### ajax-hook 的使用
```javascript
// 基本用法
window.ah.proxy({
  // 拦截所有请求
  onRequest: (config, handler) => {
    console.log('请求:', config.url);
    // 可以修改请求
    config.headers['X-Custom'] = 'value';
    handler.next(config);
  },
  
  // 拦截所有响应
  onResponse: (response, handler) => {
    console.log('响应:', response.response);
    // 可以修改响应
    response.response = modifiedData;
    handler.next(response);
  },
  
  // 错误处理
  onError: (error, handler) => {
    console.error('错误:', error);
    handler.next(error);
  }
});
```

#### 数据修改策略
```javascript
function modifyResponseData(responseText, url) {
  // 1. 解析 JSON
  let data = JSON.parse(responseText);
  
  // 2. 递归遍历查找目标字段
  function traverse(obj) {
    if (obj.clicks) {
      obj.clicks = newValue;  // 修改点击数
    }
    if (obj.impressions) {
      obj.impressions = newValue;  // 修改展示数
    }
    // ... 其他字段
    
    // 递归处理子对象
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object') {
        traverse(obj[key]);
      }
    });
  }
  
  traverse(data);
  
  // 3. 返回修改后的 JSON
  return JSON.stringify(data);
}
```

### 4. 配置系统

#### 配置结构
```javascript
{
  // 广告组级别的配置
  adGroups: [
    {
      match: { 
        name: "精确匹配的广告组名称"
        // 或
        namePattern: "/正则表达式/"
      },
      displayData: {
        impressions: "新的展示数",
        clicks: "新的点击数",
        // ... 其他指标
      }
    }
  ],
  
  // 全局配置 (应用到所有数据)
  globalData: {
    impressions: "50000",
    clicks: "3000",
    // ...
  },
  
  // 系统设置
  settings: {
    verbose: true,           // 是否显示详细日志
    enableGlobalData: false, // 是否启用全局数据修改
    autoUpdate: true         // 是否自动更新
  }
}
```

### 5. 与原项目的主要区别

| 特性 | 原项目 (dist) | 新项目 (vue3-chrome-ext-template) |
|------|--------------|----------------------------------|
| 代码混淆 | 是 | 否 (开发中可读) |
| 配置方式 | 硬编码 | 可通过 UI 配置 |
| 用户界面 | 无 | Vue 3 构建的 Popup |
| 数据存储 | 无 | Chrome Storage API |
| 可维护性 | 低 (混淆后) | 高 (清晰结构) |
| 核心技术 | ajax-hook | ajax-hook (相同) |

## 使用方法

### 开发
```bash
# 安装依赖
npm install

# 开发模式 (自动监听文件变化)
npm run dev

# 构建生产版本
npm run build
```

### 加载扩展
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 目录

### 调试
```javascript
// 在 Google Ads 页面的控制台中
window.__googleAdsInterceptor.stats      // 查看统计信息
window.__googleAdsInterceptor.config     // 查看当前配置
window.__googleAdsInterceptor.getStats() // 获取统计
window.__googleAdsInterceptor.reset()    // 重置统计
```

## 常见问题

### Q: 为什么要用 ajax-hook 而不是直接用 fetch 拦截?
A: Google Ads 使用的是 XMLHttpRequest 而不是 fetch API,所以必须拦截 XMLHttpRequest。ajax-hook 是专门用于拦截 XMLHttpRequest 的库。

### Q: 为什么需要两个注入脚本?
A: 
- `ajaxhook.min.js`: 提供拦截能力的核心库
- `inject-script.js`: 实现具体的拦截逻辑和数据修改

### Q: Content Script 和 Injected Script 有什么区别?
A:
- **Content Script**: 运行在隔离环境,可以访问 Chrome API,但不能访问页面的 JavaScript
- **Injected Script**: 运行在页面上下文,可以访问页面的 JavaScript,但不能访问 Chrome API

### Q: 如何确保拦截器在页面加载前就生效?
A: 在 manifest.json 中设置 `"run_at": "document_start"`,确保 Content Script 尽早运行。

### Q: 数据没有被修改怎么办?
A: 
1. 打开浏览器控制台查看是否有错误
2. 检查 `window.__googleAdsInterceptor.stats` 看是否拦截到请求
3. 启用 `verbose: true` 查看详细日志
4. 确认 URL 匹配规则是否正确

## 进一步优化建议

1. **添加更多 API 端点的支持**: 分析 Google Ads 的其他 API 调用
2. **优化数据结构匹配**: 使用更智能的字段匹配算法
3. **添加数据验证**: 确保修改的数据格式正确
4. **性能优化**: 避免不必要的数据遍历
5. **错误恢复**: 添加更完善的错误处理机制
