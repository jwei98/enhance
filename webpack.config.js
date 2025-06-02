const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    'content/content': './src/content/content.ts',
    'options/options': './src/options/options.ts'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'content/content.css', to: 'content/content.css' },
        { from: 'options/options.html', to: 'options/options.html' },
        { from: 'options/options.css', to: 'options/options.css' },
        { from: 'icons', to: 'icons' },
        { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js', to: 'browser-polyfill.js' }
      ],
    }),
  ],
  devtool: 'source-map',
  optimization: {
    minimize: false // Keep readable for debugging
  }
};