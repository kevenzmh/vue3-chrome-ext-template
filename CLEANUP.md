# 清理说明

## 需要保留的文件

### 核心文件
- `manifest.json` - Chrome 扩展配置
- `package.json` - 项目依赖
- `vue.config.js` - 构建配置
- `babel.config.js` - Babel 配置
- `.eslintrc` - ESLint 配置
- `.gitignore` - Git 忽略文件

### 源代码 (src/)
```
src/
├── pages/
│   ├── background/
│   │   └── main.js         # 保留 - Background Script
│   ├── content/
│   │   └── main.js         # 保留 - Content Script
│   ├── popup/
│   │   ├── main.js         # 保留 - Popup 入口
│   │   └── App.vue         # 保留 - Popup 界面
│   └── options/
│       ├── main.js         # 保留 - Options 页面入口
│       └── App.vue         # 保留 - Options 页面界面
```

### 公共资源 (public/)
```
public/
├── js/
│   └── inject-script.js    # 保留 - 拦截脚本
├── lib/
│   └── ajaxhook.min.js     # 保留 - ajax-hook 库
└── index.html              # 保留 - HTML 模板
```

## 可以删除的文件

以下文件/目录可以安全删除：

1. `src/assets/` - 如果不需要 logo
2. `src/components/HelloWorld.vue` - 示例组件
3. `src/config/ads-config.js` - 现在配置在代码中
4. `test-page.html` - 测试文件
5. `README.md` - 如果有更新的文档
6. `.vscode/` - VS Code 配置（可选）
7. `icons/` - 如果原项目不需要
8. `pnpm-lock.yaml` - 如果使用 npm

## 清理步骤

### 手动清理
直接删除以下目录/文件：
- `src/assets/`
- `src/components/`
- `src/config/`
- `test-page.html`

### 重新构建
```bash
npm run build
```

## 最小化项目结构

清理后的目录结构应该是：

```
vue3-chrome-ext-template/
├── .eslintrc
├── .gitignore
├── babel.config.js
├── manifest.json
├── package.json
├── vue.config.js
├── public/
│   ├── index.html
│   ├── js/
│   │   └── inject-script.js
│   └── lib/
│       └── ajaxhook.min.js
├── src/
│   └── pages/
│       ├── background/
│       │   └── main.js
│       ├── content/
│       │   └── main.js
│       ├── popup/
│       │   ├── main.js
│       │   └── App.vue
│       └── options/
│           ├── main.js
│           └── App.vue
└── dist/                    # 构建输出
```
