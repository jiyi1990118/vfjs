/**
 * 对vf文件内部的 style 进行处理
 */
var loaderUtils = require('loader-utils')
var path = require('path')
var hash = require('hash-sum')
var qs = require('querystring')

module.exports = function () {}

// loader 预先处理函数 （跳跃处理）
module.exports.pitch = function (remainingRequest) {
	
	// 检查目标环境
	var isServer = this.target === 'node'
	// 检查是否生产环境
	var isProduction = this.minimize || process.env.NODE_ENV === 'production'
	// 浏览器端样式添加code路径
	var addStylesClientPath = loaderUtils.stringifyRequest(this, '!' + path.join(__dirname, 'lib/addStylesClient.js'))
	// 服务端渲染样式添加code路径
	var addStylesServerPath = loaderUtils.stringifyRequest(this, '!' + path.join(__dirname, 'lib/addStylesServer.js'))
	// 添加sourceMap 映射路径
	var addStylesShadowPath = loaderUtils.stringifyRequest(this, '!' + path.join(__dirname, 'lib/addStylesShadow.js'))
	
	// 生成新的请求路径
	var request = loaderUtils.stringifyRequest(this, '!!' + remainingRequest)
	// 真实资源路径
	var relPath = path.relative(__dirname, this.resourcePath).replace(/\\/g, '/')
	// 根据路径生成唯一标识
	var id = JSON.stringify(hash(request + relPath))
	// 获取当前loader 配置
	var options = loaderUtils.getOptions(this) || {}
	
	// 检查是否 vf 文件
	var isVf = (
		/"vf":true/.test(remainingRequest) ||
		options.manualInject ||
		qs.parse(this.resourceQuery.slice(1)).vf != null
	)
	
	var shared = [
		'// 样式加载器:通过添加<style>标记向DOM添加一些css',
		'',
		'// load the styles',
		'var content = require(' + request + ');',
		// 'module.exports =content',
		// content list format is [id, css, media, sourceMap]
		"if(typeof content === 'string') content = [[module.id, content, '']];",
		'if(content.locals) module.exports = content.locals;'
	]
	
	
	// return shared.join('\n');
	
	// 检查是否 ShadowDOM 模式
	if (options.shadowMode) {
		return shared.concat([
			'// add CSS to Shadow Root',
			'var add = require(' + addStylesShadowPath + ').default;',
			'module.exports.injectStyle = function (shadowRoot) {',
			'  add(' + id + ', content, shadowRoot)',
			'};'
		]).join('\n')
		// 检查是否服务端渲染
	} else if (!isServer) {
		// on the client: dynamic inject + hot-reload
		var code = [
			'// add the styles to the DOM',
			'var add = require(' + addStylesClientPath + ').default',
			'var update = add(' + id + ', content, ' + isProduction + ', ' + JSON.stringify(options) + ');'
		]
		
		// 检查是否生产环境
		if (!isProduction) {
			code = code.concat([
				'// 模块热加载替换',
				'if(module.hot) {',
				' // 当样式改变时，更新<style>标记',
				' if(!content.locals) {',
				'   module.hot.accept(' + request + ', function() {',
				'     var newContent = require(' + request + ');',
				"     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];",
				'     update(newContent);',
				'   });',
				' }',
				' // 在处理模块时，删除<style>标记',
				' module.hot.dispose(function() { update(); });',
				'}'
			])
		}
		return shared.concat(code).join('\n')
		// 服务端渲染
	} else {
		// 检查是否vf加载进来，则添加入组件上下文环境中
		if (isVf) {
			// 内部vf文件 提供一个公共函数，方便可以被调用
			return shared.concat([
				'// 向SSR上下文添加CSS',
				'var add = require(' + addStylesServerPath + ').default',
				'module.exports = function (context) {',
				'  add(' + id + ', content, ' + isProduction + ', context)',
				'};'
			]).join('\n')
		} else {
			// 正常引入
			return shared.concat([
				'require(' + addStylesServerPath + ').default(' + id + ', content, ' + isProduction + ')'
			]).join('\n')
		}
	}
}
