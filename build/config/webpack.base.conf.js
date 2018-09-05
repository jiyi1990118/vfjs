'use strict'
const path = require('path')
const utils = require('../utils')
const config = require('../config')
const vfLoaderConfig = require('./vf-loader.conf')
const VfLoaderPlugin = require('../loaders/vf-loader').VfLoaderPlugin


var MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const safeParser = require('postcss-safe-parser');

function resolve(dir) {
	return path.join(__dirname, '..', dir)
}

const createLintingRule = () => ({
	test: /\.(js|vf)$/,
	loader: 'eslint-loader',
	enforce: 'pre',
	include: [resolve('src'), resolve('test')],
	options: {
		formatter: require('eslint-friendly-formatter'),
		emitWarning: !config.dev.showEslintErrorsInOverlay
	}
})

module.exports = {
	context: path.resolve(__dirname, '../'),
	entry: {
		app: path.resolve(__dirname, '../../example/main.js')
	},
	output: {
		path: config.build.assetsRoot,
		filename: '[name].js',
		publicPath: process.env.NODE_ENV === 'production'
			? config.build.assetsPublicPath
			: config.dev.assetsPublicPath
	},
	// 动态添加loader
	resolveLoader: {
		modules:[
			'node_modules',
			path.resolve(__dirname, '../loaders'),
		]
	},
	resolve: {
		extensions: ['.js', '.vf', '.json'],
		alias: {
			'$vf': 'vf/dist/vf.js',
			'@': resolve('src'),
		}
	},
	module: {
		rules: [
			// ...(config.dev.useEslint ? [createLintingRule()] : []),
			{
				test: /\.vf$/,
				loader:'vf-loader', // require.resolve('../loaders/vf-loader'),
				options: vfLoaderConfig
			},
			{
				test: /\.js$/,
				loader: 'babel-loader',
				include: [resolve('src'), resolve('test'), resolve('node_modules/webpack-dev-server/client')]
			},
			{
				test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: utils.assetsPath('img/[name].[hash:7].[ext]')
				}
			},
			{
				test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: utils.assetsPath('media/[name].[hash:7].[ext]')
				}
			},
			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
				}
			}
		]
	},
	plugins: [
		new VfLoaderPlugin(),
		// css 提取
		new MiniCssExtractPlugin({
			filename: 'css/app.[name].css',
			chunkFilename: 'css/app.[contenthash:12].css'  // use contenthash *
		}),
		// Compress extracted CSS. We are using this plugin so that possible
		// duplicated CSS from different components can be deduped.
		new OptimizeCSSPlugin({
			cssProcessorOptions: Object.assign({
				parser: safeParser,
				safe: true
			},config.build.productionSourceMap ? {
				map: {
					inline: true
				}
			} : {})
		}),
	],
	node: {
		// prevent webpack from injecting useless setImmediate polyfill because Vue
		// source contains it (although only uses it if it's native).
		setImmediate: false,
		// prevent webpack from injecting mocks to Node native modules
		// that does not make sense for the client
		dgram: 'empty',
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
		child_process: 'empty'
	}
}
