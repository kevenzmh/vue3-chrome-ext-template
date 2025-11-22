# Google Ads 数据网络拦截器 v2.0

基于 Vue 3 开发的 Chrome 扩展，通过**网络拦截**技术修改 Google Ads API 响应数据，实现对页面显示数据的彻底修改。

## ✨ 核心功能

### 🔧 网络拦截技术
- **Fetch API 拦截**: 拦截并修改所有 fetch 请求的响应
- **XMLHttpRequest 拦截**: 支持传统 XHR 请求拦截
- **API 层面修改**: 在数据返回前就完成修改，比 DOM 修改更彻底
- **多格式支持**: 自动识别并处理多种 API 响应格式

### 📊 数据修改能力
修改以下广告指标的显示数据：
- 展示次数 (Impressions)
- 点击次数 (Clicks)
- 转化次数 (Conversions)
- 费用 (Cost)
- 点击率 (CTR)
- 每次点击费用 (CPC)
- 转化率 (Conversion Rate)
- 每次转化费用 (CPA)

### 🎯 智能匹配
- **精确名称匹配**: 匹配特定广告组名称
- **正则表达式匹配**: 使用正则模式批量匹配
- **全局数据模式**: 可选对所有广告组应用相同数据

## 🚀 快速开始

### 1. 环境准备
```bash
# Node.js 版本要求: >= 14.x
node --version

# 克隆项目
git clone <your-repo-url>
cd vue3-chrome-ext-template
```

### 2. 安装依赖
```bash
# 使用 npm
npm install

# 或使用 pnpm (推荐)
pnpm install

# 或使用 yarn
yarn install
```

### 3. 构建项目
```bash
# 开发模式（支持热重载）
npm run dev

# 生产构建
npm run build
```

### 4. 安装扩展
1. 打开 Chrome: `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的 `dist` 文件夹

## 📖 使用方法

### 基本使用流程

1. **打开 Google Ads 页面**
   ```
   https://ads.google.com/
   ```

2. **激活拦截器**
   - 点击浏览器工具栏的扩展图标
   - 点击"激活拦截器"按钮

3. **刷新页面**
   - 点击"刷新页面"按钮
   - 或按 F5 手动刷新

4. **查看效果**
   - 打开开发者工具 (F12)
   - 查看 Console 日志
   - 观察数据变化

### 配置修改规则

配置文件: `src/config/ads-config.js`

```javascript
export const adsConfig = {
  adGroups: [
    {
      // 精确匹配
      match: { 
        name: "示例广告组1" 
      },
      displayData: {
        impressions: "125680",      // 注意：不带逗号
        clicks: "8432",
        conversions: "156",
        cost: "2345.67",            // 注意：纯数字，不带货币符号
        ctr: "6.70%",
        cpc: "0.28",
        conversionRate: "1.85%",
        cpa: "15.04"
      }
    },
    {
      // 正则匹配
      match: { 
        namePattern: "/测试广告组.*/" 
      },
      displayData: {
        impressions: "89234",
        clicks: "5678",
        // ...
      }
    }
  ],
  
  // 全局数据（可选）
  globalData: {
    impressions: "50000",
    clicks: "3000",
    conversions: "60",
    cost: "840.00",
    ctr: "6.00%",
    cpc: "0.28",
    conversionRate: "2.00%",
    cpa: "14.00"
  },
  
  // 设置
  settings: {
    verbose: true,              // 显示详细日志
    enableGlobalData: false,    // 启用全局数据
    autoUpdate: true            // 自动更新
  }
}
```

### ⚠️ 数据格式要求

**网络拦截模式的数据格式要求**:

✅ **正确格式**:
```javascript
impressions: "125680"     // 不带逗号
cost: "2345.67"           // 纯数字
ctr: "6.70%"              // 可以带百分号
```

❌ **错误格式**:
```javascript
impressions: "125,680"    // 带逗号会解析失败
cost: "¥2,345.67"         // 带符号和逗号
```

## 🏗️ 项目结构

```
vue3-chrome-ext-template/
├── src/
│   ├── pages/
│   │   ├── popup/              # 弹窗界面
│   │   │   ├── Index.vue       # 主界面组件
│   │   │   └── main.js
│   │   ├── options/            # 配置页面
│   │   ├── content/            # 内容脚本
│   │   │   └── main.js         # 拦截器管理
│   │   └── background/         # 后台脚本
│   ├── config/
│   │   └── ads-config.js       # 数据配置文件
│   └── components/             # Vue 组件
├── public/
│   └── js/
│       └── inject-script.js    # 注入脚本（核心拦截逻辑）
├── manifest.json               # 扩展清单
├── package.json
└── vue.config.js
```

## 🔍 工作原理

### 网络拦截流程

```
┌─────────────────┐
│  Google Ads 页面  │
└────────┬────────┘
         │ 1. 页面加载
         ▼
┌─────────────────┐
│  Content Script  │ ← 加载配置
└────────┬────────┘
         │ 2. 注入脚本
         ▼
┌─────────────────┐
│  Inject Script   │ ← 拦截 fetch/XHR
└────────┬────────┘
         │ 3. 拦截 API 请求
         ▼
┌─────────────────┐
│  原始 API 响应   │
└────────┬────────┘
         │ 4. 修改数据
         ▼
┌─────────────────┐
│  修改后的响应    │ → 返回给页面
└─────────────────┘
```

### 关键技术点

1. **Script 注入**: 通过 `web_accessible_resources` 注入脚本到页面上下文
2. **Fetch 劫持**: 重写 `window.fetch` 方法
3. **XHR 劫持**: 重写 `XMLHttpRequest.prototype` 方法
4. **消息通信**: Content Script ↔ Inject Script 使用 `postMessage`
5. **配置管理**: Chrome Storage API 存储配置

## 🐛 调试指南

### 检查拦截器状态

打开 Console (F12)，应该看到:
```
[Google Ads Interceptor] 网络拦截脚本已加载
[Google Ads Interceptor] Fetch 拦截器已安装
[Google Ads Interceptor] XMLHttpRequest 拦截器已安装
[Google Ads Interceptor] 配置已更新
[Google Ads Interceptor] 初始化完成
```

### 查看拦截日志

如果 `verbose: true`，每次拦截会输出:
```
[Google Ads Interceptor] 拦截到请求: https://ads.google.com/api/...
[Google Ads Interceptor] 原始数据: {...}
[Google Ads Interceptor] 修改后数据: {...}
```

### 验证数据修改

1. 打开 Network 面板
2. 刷新页面
3. 找到 Google Ads 的 API 请求
4. 查看 Response 数据
5. 确认数据已被修改

## ❓ 常见问题

### Q1: 拦截器未生效？

**A**: 确保:
1. manifest.json 中 `run_at: "document_start"`
2. 激活后刷新页面
3. 查看 Console 是否有错误

### Q2: 数据格式错误？

**A**: 检查配置文件:
- 数字不要带逗号
- 费用不要带货币符号
- 使用纯数字字符串

### Q3: 只修改了部分数据？

**A**: 可能的原因:
1. API 数据结构不匹配
2. 需要调整 `inject-script.js` 中的数据处理逻辑
3. 开启 verbose 模式查看原始数据结构

### Q4: Console 报错 "Cannot parse JSON"？

**A**: 配置文件格式错误:
- 检查是否有逗号在数字中
- 检查正则表达式格式是否正确

## 🎓 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vue CLI 5
- **扩展API**: Chrome Extension Manifest V3
- **拦截技术**: Fetch/XHR Hijacking
- **存储**: Chrome Storage API

## ⚠️ 免责声明

1. **学习目的**: 本项目仅用于学习浏览器扩展开发和网络拦截技术
2. **不影响真实数据**: 修改的仅是本地显示数据，不会影响 Google Ads 服务器数据
3. **测试环境**: 建议在测试账户中使用
4. **遵守规则**: 使用前请确保了解并遵守 Google Ads 的使用条款

## 🔄 更新日志

### v2.0.0 (2024-01-xx)
- ✨ 完全重写为网络拦截模式
- ✨ 支持 Fetch 和 XMLHttpRequest 拦截
- ✨ 改进的配置管理系统
- ✨ 实时日志和状态显示
- 🐛 修复多种 API 格式兼容问题
- 📝 完善的文档和使用指南

### v1.0.0
- 🎉 初始版本（基于 DOM 修改）

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**注意**: 本工具仅供学习和研究使用，请勿用于任何违反服务条款的行为。
