const fs = require('fs-extra');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

// 清空 dist 目录
fs.emptyDirSync(distDir);

// 复制文件
const filesToCopy = [
  { from: 'manifest.json', to: 'manifest.json' },
  { from: 'public/js/content.js', to: 'js/content.js' },
  { from: 'public/lib/ajaxhook.min.js', to: 'lib/ajaxhook.min.js' }
];

filesToCopy.forEach(({ from, to }) => {
  const fromPath = path.join(__dirname, from);
  const toPath = path.join(distDir, to);
  
  fs.ensureDirSync(path.dirname(toPath));
  
  if (fs.existsSync(fromPath)) {
    fs.copySync(fromPath, toPath);
    console.log(`✓ 复制: ${from} -> ${to}`);
  } else {
    console.log(`✗ 文件不存在: ${from}`);
  }
});

// 创建占位符 icons
const iconsDir = path.join(distDir, 'icons');
fs.ensureDirSync(iconsDir);

// 检查是否有 icons,如果没有则从 dist 项目复制
const sourceIconsDir = path.join(__dirname, '../dist/icons');
if (fs.existsSync(sourceIconsDir)) {
  fs.copySync(sourceIconsDir, iconsDir);
  console.log('✓ 复制图标文件');
} else {
  console.log('⚠ 未找到图标文件,需要手动添加');
}

console.log('\n构建完成! 扩展输出到:', distDir);
