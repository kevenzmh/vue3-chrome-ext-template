# Google Ads 数据替换工具

纯后台运行的 Chrome 扩展,自动拦截和替换 Google Ads 数据。

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 构建
```bash
npm run build
```

### 3. 加载扩展
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 文件夹

### 4. 使用
- 访问 https://ads.google.com
- 扩展会自动在后台运行
- 查看控制台可以看到拦截日志

## 自定义数据

编辑 `public/js/content.js` 中的 `SERVER_DATA` 对象来修改显示的数据:

```javascript
const SERVER_DATA = {
  accountCost: {
    clicks: 15234,        // 修改这里
    impressions: 234567,  // 修改这里
    cost: 4567.89,        // 修改这里
    // ...
  },
  // ...
};
```

修改后重新运行 `npm run build`。

## 文件结构

```
├── manifest.json          # 扩展配置
├── public/
│   ├── js/
│   │   └── content.js     # 主要逻辑 (修改数据在这里)
│   └── lib/
│       └── ajaxhook.min.js # AJAX拦截库
├── dist/                  # 构建输出 (加载这个文件夹到Chrome)
└── build.js              # 构建脚本
```

## 工作原理

1. 扩展在 Google Ads 页面加载时自动注入
2. 使用 ajaxhook 拦截所有 API 请求
3. 检测到 Google Ads API 时,用自定义数据替换响应
4. 页面显示替换后的数据

## 注意事项

- 纯后台运行,无需任何操作界面
- 所有数据在 `content.js` 中配置
- 修改数据后需要重新构建
