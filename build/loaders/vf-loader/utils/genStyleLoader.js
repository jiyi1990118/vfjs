'use strict'

exports.cssLoaders = function (options) {
	options = options || {}
	
	const cssLoader = {
		loader: 'css-loader',
		options: {
			sourceMap: !!options.cssSourceMap
		}
	}
	
	const postcssLoader = {
		loader: 'postcss-loader',
		options: {
			sourceMap: !!options.cssSourceMap
		}
	}
	
	// generate loader string to be used with extract text plugin
	function generateLoaders(loader, loaderOptions) {
		const loaders = options.usePostCSS ? [cssLoader, postcssLoader] : [cssLoader]
		
		if (loader) {
			loaders.push({
				loader: loader + '-loader',
				options: Object.assign({}, loaderOptions, {
					sourceMap: !!options.cssSourceMap
				})
			})
		}
		return loaders.map(function (info) {
			return info.loader+(info.options?'?'+JSON.stringify(info.options):'')
		})
	}
	
	// https://vue-loader.vuejs.org/en/configurations/extract-css.html
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
exports.genStyleLoaderString = function (type,options) {
	return exports.cssLoaders(options)[type]
}
