'use strict'

const vfStyleLoaderPath = require.resolve('../loaders/vf-style-loader')
// css 提取插件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

exports.cssLoaders = function (options) {
	options = options || {}
	
	const cssLoader = {
		loader: 'css-loader',
		options: {
			modules: options.cssModule,
			sourceMap: !!options.cssSourceMap,
		}
	}
	
	const postcssLoader = {
		loader: 'postcss-loader',
		options: {
			sourceMap: !!options.cssSourceMap
		}
	}
	
	// 用于生成提取文本插件的加载器字符串
	function generateLoaders(loader, loaderOptions) {
		let loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]
		
		if (loader) {
			loaders.push({
				loader: loader + '-loader',
				options: Object.assign({}, loaderOptions, {
					sourceMap: !!options.cssSourceMap
				})
			})
		}
		
		// vf-style-loader 配置
		const styleLoader = {
			loader: vfStyleLoaderPath,
			options: Object.assign({}, options)
		}
		
		// 检查是否生产环境，则启用css提取
		if (options.extract) {
			loaders.unshift(MiniCssExtractPlugin.loader)
			loaders.unshift(styleLoader)
		} else {
			loaders.unshift(styleLoader)
		}
		
		return loaders.map(function (info) {
			return typeof info === "string" ? info : info.loader + (info.options ? '?' + JSON.stringify(info.options) : '')
		})
	}
	
	return {
		css: generateLoaders(),
		postcss: generateLoaders(),
		less: generateLoaders('less'),
		sass: generateLoaders('sass', {indentedSyntax: true}),
		scss: generateLoaders('sass'),
		stylus: generateLoaders('stylus'),
		styl: generateLoaders('stylus')
	}
}

// 生成style loader request 字符
exports.genStyleLoaderString = function (type, options) {
	return exports.cssLoaders(options)[type]
}
