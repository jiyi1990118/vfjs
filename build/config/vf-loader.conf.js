'use strict'
const config = require('../config')
const isProduction = process.env.NODE_ENV === 'production'
const sourceMapEnabled = isProduction
	? config.build.productionSourceMap
	: config.dev.cssSourceMap

module.exports = {
	// 是否提取css
	extract:process.env.NODE_ENV === 'production',
	// 启用postcss
	usePostCSS: true,
	cssSourceMap: sourceMapEnabled,
	cacheBusting: config.dev.cacheBusting,
	// 在模版编译过程中，编译器可以将某些属性，如 src 路径，转换为require调用，以便目标资源可以由 webpack 处理.
	transformToRequire: {
		video: ['src', 'poster'],
		source: 'src',
		img: 'src',
		image: 'xlink:href'
	}
}
