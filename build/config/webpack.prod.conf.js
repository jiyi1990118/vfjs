'use strict'
const utils = require('../utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const env = require('../config/prod.env')

const webpackConfig = merge(baseWebpackConfig, {
	module: {
		rules: utils.styleLoaders({
			sourceMap: config.build.productionSourceMap,
			extract: true,
			usePostCSS: true
		})
	},
	devtool: config.build.productionSourceMap ? config.build.devtool : false,
	mode: 'production',
	output: {
		path: config.build.assetsRoot,
		filename: utils.assetsPath('js/[name].[chunkhash].js'),
		chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					test: /[\\/]node_modules[\\/]/,
					chunks: 'initial',
					name: 'vendors',
				},
				'async-vendors': {
					test: /[\\/]node_modules[\\/]/,
					minChunks: 2,
					chunks: 'async',
					name: 'async-vendors'
				}
			}
		},
		runtimeChunk: {name: 'runtime'}
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': env
		}),
		new UglifyJsPlugin({
			uglifyOptions: {
				compress: {
					warnings: false
				}
			},
			sourceMap: config.build.productionSourceMap,
			parallel: true
		}),
		/**
		 * 参数说明：
		 title: title值用于生成的HTML文档。
		 filename: 将生成的HTML写入到该文件中。默认写入到index.html中。你也可以在这儿指定子目录 (eg: assets/admin.html)。
		 template: Webpack require path 到 template中。 详情查阅 docs
		 inject: true | 'head' | 'body' | false添加所有的静态资源（assets）到模板文件或templateContent 。当传入true或'body'时，所有javascript资源将被放置到body 元素的底部。 当传入'head'时， 所有的脚本将被放置到head元素中。
		 favicon: 添加指定的favicon path到输出的html文件。
		 minify: {...} | false 传入一个html-minifier 对象选项来压缩输出的html文件。
		 hash: true | false 如果值为true，就添加一个唯一的webpack compilation hash给所有已included的 scripts 和 CSS 文件。这对缓存清除（cache busting）十分有用。
		 cache: true | false 如果为true (默认)，只要文件被更改了就emit(发表)文件。
		 showErrors: true | false如果为true (默认)，详细的错误信息将被写入到HTML页面。
		 chunks:允许你只添加某些chunks (e.g. only the unit-test chunk)
		 chunksSortMode: 在chunks被include到html文件中以前，允许你控制chunks 应当如何被排序。允许的值: 'none' | 'auto' | 'dependency' | {function} - 默认值: 'auto'。
		 excludeChunks: 允许你跳过某些chunks (e.g. don't add the unit-test chunk)
		 xhtml: true | false 如果为true， 将 link 标签渲染为自闭合标签, XHTML compliant。 默认是 false。
		 see https://github.com/ampedandwired/html-webpack-plugin
		 */
		new HtmlWebpackPlugin({
			filename: config.comm.filename,
			template: config.comm.template,
			inject: true,
			minify: {
				removeComments: true,
				collapseWhitespace: true,
				removeAttributeQuotes: true
				// more options:
				// https://github.com/kangax/html-minifier#options-quick-reference
			},
			// necessary to consistently work with multiple chunks via CommonsChunkPlugin
			chunksSortMode: 'dependency'
		}),
		// keep module.id stable when vendor modules does not change
		new webpack.HashedModuleIdsPlugin(),
		// enable scope hoisting
		new webpack.optimize.ModuleConcatenationPlugin(),
		// copy custom static assets
		new CopyWebpackPlugin([
			{
				from: config.comm.assetsSubSourcePath,
				to: config.comm.assetsSubDirectory,
				ignore: ['.*']
			}
		])
	]
})

if (config.build.productionGzip) {
	const CompressionWebpackPlugin = require('compression-webpack-plugin')
	
	webpackConfig.plugins.push(
		new CompressionWebpackPlugin({
			asset: '[path].gz[query]',
			algorithm: 'gzip',
			test: new RegExp(
				'\\.(' +
				config.build.productionGzipExtensions.join('|') +
				')$'
			),
			threshold: 10240,
			minRatio: 0.8
		})
	)
}

if (config.build.bundleAnalyzerReport) {
	const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
	webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig
