# 使用说明

## 构建和安装

```bash
# 1. 安装依赖
npm install

# 2. 构建扩展
npm run build

# 3. 加载到 Chrome
打开 chrome://extensions/
开启"开发者模式"
点击"加载已解压的扩展程序"
选择项目中的 dist 文件夹
```

## 修改数据

编辑 `public/js/content.js` 文件,找到 `SERVER_DATA` 对象:

```javascript
const SERVER_DATA = {
  accountCost: {
    clicks: 15234,        // ← 修改点击数
    impressions: 234567,  // ← 修改展示数
    cost: 4567.89,        // ← 修改费用
    // ...
  },
  
  campaignCost: [
    {
      name: '我的广告系列',  // ← 修改名称
      stats: {
        clicks: 5678,      // ← 修改数据
        // ...
      }
    }
  ]
};
```

修改后:
1. 保存文件
2. 运行 `npm run build`
3. 在 Chrome 扩展页面点击"重新加载"
4. 刷新 Google Ads 页面

## 验证

1. 访问 https://ads.google.com
2. 打开 Chrome 控制台 (F12)
3. 查看日志:
   ```
   [Data Replacer] 初始化中...
   [Data Replacer] ajaxhook 已加载
   [Data Replacer] 拦截器已注入
   [Interceptor] 开始拦截...
   [Interceptor] 拦截器已启动
   ```
4. 浏览页面,看到拦截日志:
   ```
   [Interceptor] 拦截: .../OverviewService/Get
   [Interceptor] 已替换
   ```

## 文件说明

- `manifest.json` - 扩展配置
- `public/js/content.js` - 主逻辑 (修改数据在这里)
- `public/lib/ajaxhook.min.js` - AJAX 拦截库
- `build.js` - 构建脚本
- `dist/` - 构建输出 (加载这个文件夹)
