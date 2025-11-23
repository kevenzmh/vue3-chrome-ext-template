const path = require('node:path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

// 无界面版本 - 不需要任何页面构建
module.exports = {
  // 不构建任何页面
  pages: {},
  filenameHashing: false,
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve('manifest-headless.json'),
            to: `${path.resolve('dist')}/manifest.json`
          },
          {
            from: path.resolve('public/lib'),
            to: `${path.resolve('dist')}/lib`
          },
          {
            from: path.resolve('src/pages/content/request-interceptor.js'),
            to: `${path.resolve('dist')}/src/pages/content/request-interceptor.js`
          },
          {
            from: path.resolve('public/data'),
            to: `${path.resolve('dist')}/public/data`
          },
          {
            from: path.resolve('src/assets'),
            to: `${path.resolve('dist')}/src/assets`
          }
        ]
      })
    ]
  }
}