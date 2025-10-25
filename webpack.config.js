const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./main.ts",
  mode: "production", // production  development
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    // clean: true  // 每次打包前清空 dist 目录（Webpack 5 新增）
    library: {
      name: 'imio-sdk-lite',
      type: 'umd', // 通用模块定义（支持 CommonJS、AMD、浏览器全局变量）
      export: 'default'
    },
  },

  devtool: "source-map",
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    compress: false,
    port: 9900,
  },
  resolve: {
    fallback: {
      buffer: require.resolve("buffer/"),
    },
    extensions: ['.ts', '.js', ".json"]  // 优先解析 .ts，再解析 .js
  },
  // 模块规则（处理 TS 文件）
  module: {
    rules: [
      {
        test: /\.ts$/,  // 匹配所有 .ts 文件
        use: 'ts-loader',  // 使用 ts-loader 转译 TS 为 JS
        exclude: /node_modules/  // 排除 node_modules

      },
      {
        test: /\.css$/i, // 匹配所有 .css 后缀的文件
        use: [
          'style-loader', // 第二步：将 CSS 注入到 DOM（<style> 标签）
          'css-loader'    // 第一步：解析 CSS 文件
        ],
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "index.html"),
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
