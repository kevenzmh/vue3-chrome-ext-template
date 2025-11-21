# Google Ads 数据展示修改器

基于 Vue 3 开发的 Chrome 扩展，用于修改 Google Ads 页面显示的广告数据（展示次数、点击次数、转化次数等）。

## 功能特性

- 🎯 **智能匹配**: 支持精确名称匹配和正则表达式匹配广告组
- 📊 **数据替换**: 修改页面显示的展示次数、点击次数、转化次数、费用等数据
- 🔧 **批量处理**: 一键修改多个广告组的显示数据
- 📝 **配置管理**: 通过配置文件预设虚拟数据
- 🔄 **自动刷新**: 支持自动检测页面变化并重新应用数据
- 🛡️ **数据备份**: 自动备份原始显示数据
- 🎨 **友好界面**: 直观的弹窗和配置管理界面

## 安装步骤

### 1. 安装依赖
```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install

# 或使用 yarn
yarn install
```

### 2. 构建项目
```bash
# 开发模式（支持热重载）
npm run dev

# 生产构建
npm run build
```

### 3. 安装到 Chrome 浏览器
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 `dist` 文件夹
6. 扩展安装完成！

## 使用方法

### 基本使用
1. 打开 [Google Ads](https://ads.google.com/) 页面
2. 导航到广告组管理页面
3. 点击浏览器工具栏中的扩展图标
4. 点击"开始修改广告组"按钮

### 配置修改规则
1. 右键点击扩展图标，选择"选项"
2. 在配置页面查看当前的修改规则
3. 根据需要修改 `src/config/ads-config.js` 文件
4. 重新构建项目

## 配置说明

配置文件位于 `src/config/ads-config.js`，包含以下主要部分：

### 广告组数据展示规则
```javascript
{
  adGroups: [
    {
      // 匹配条件
      match: {
        name: "示例广告组1",           // 精确匹配名称
        // namePattern: /测试.*广告组/  // 或使用正则匹配
      },
      // 要显示的虚拟数据
      displayData: {
        impressions: "125,680",      // 展示次数
        clicks: "8,432",             // 点击次数
        conversions: "156",          // 转化次数
        cost: "¥2,345.67",          // 费用
        ctr: "6.70%",               // 点击率
        cpc: "¥0.28",               // 每次点击费用
        conversionRate: "1.85%",     // 转化率
        cpa: "¥15.04"               // 每次转化费用
      }
    }
  ]
}
```

### 支持的数据类型
- `impressions`: 展示次数
- `clicks`: 点击次数
- `conversions`: 转化次数
- `cost`: 费用（支持¥和$符号）
- `ctr`: 点击率（百分比）
- `cpc`: 每次点击费用
- `conversionRate`: 转化率（百分比）
- `cpa`: 每次转化费用

### 全局设置
```javascript
{
  settings: {
    modificationDelay: 500,     // 修改间隔（毫秒）
    verbose: true,              // 详细日志
    enableGlobalData: false,    // 是否对所有广告组使用全局数据
    autoRefresh: true,          // 自动刷新
    refreshInterval: 5000       // 自动刷新间隔（毫秒）
  },
  // 全局虚拟数据（当enableGlobalData为true时使用）
  globalData: {
    impressions: "50,000",
    clicks: "3,000",
    conversions: "60",
    cost: "¥840.00",
    ctr: "6.00%",
    cpc: "¥0.28",
    conversionRate: "2.00%",
    cpa: "¥14.00"
  }
}
```

## 项目结构

```
├── src/
│   ├── pages/
│   │   ├── popup/          # 弹窗界面
│   │   ├── options/        # 配置管理页面
│   │   ├── content/        # 内容脚本（注入到网页）
│   │   └── background/     # 后台脚本
│   ├── config/
│   │   └── ads-config.js   # 广告组修改配置
│   └── components/         # Vue 组件
├── manifest.json           # 扩展清单文件
└── dist/                   # 构建输出目录
```

## 注意事项

⚠️ **重要提醒**:
- 本扩展仅用于学习和测试目的
- 使用前请确保了解 Google Ads 的使用条款
- 建议在测试账户中先进行验证
- 修改广告组数据可能影响广告投放效果，请谨慎操作

## 开发说明

### 自定义选择器
如果 Google Ads 页面结构发生变化，可能需要更新选择器配置：

```javascript
selectors: {
  adGroupTable: '[data-testid="ad-groups-table"]',
  adGroupRow: 'tbody tr',
  adGroupName: 'td:first-child a',
  // ... 其他选择器
}
```

### 扩展功能
- 可以添加更多匹配条件（如标签、创建时间等）
- 支持更多修改操作（如关键词、广告等）
- 添加数据导入/导出功能

## 故障排除

### 常见问题
1. **扩展无法加载**: 检查 manifest.json 语法是否正确
2. **无法检测页面**: 确认已打开 Google Ads 页面
3. **修改失败**: 检查页面选择器是否需要更新

### 调试方法
1. 打开 Chrome 开发者工具
2. 查看 Console 标签页的日志信息
3. 检查 Extensions 页面的错误信息

## 许可证

本项目基于 MIT 许可证开源。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

