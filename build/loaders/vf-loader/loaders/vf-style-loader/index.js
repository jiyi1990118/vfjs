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
	
	// direct css import from js --> direct, or manually call `styles.__inject__(ssrContext)` with `manualInject` option
	// css import from vf file --> component lifecycle linked
	// style embedded in vf file --> component lifecycle linked
	var isVf = (
		/"vf":true|vf=true/.test(remainingRequest) ||
		options.manualInject ||
		qs.parse(this.resourceQuery.slice(1)).vf != null
	)
	
	var shared = [
		'// style-loader: Adds some css to the DOM by adding a <style> tag',
		'',
		'// load the styles',
		'var content = require(' + request + ');',
		'module.exports =content',
		// content list format is [id, css, media, sourceMap]
		//"if(typeof content === 'string') content = [[module.id, content, '']];",
		//'if(content.locals) module.exports = content.locals;'
	]
	
	
	console.log(isVf,this.target  )
	return shared.join('\n');
	
	// shadowMode is enabled in vf-cli with vf build --target web-component.
	// exposes the same __inject__ method like SSR
	
	// 检查是否vf组件style模块
	if (options.shadowMode) {
		return shared.concat([
			'// add CSS to Shadow Root',
			'var add = require(' + addStylesShadowPath + ').default',
			'module.exports.__inject__ = function (shadowRoot) {',
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
		if (!isProduction) {
			code = code.concat([
				'// Hot Module Replacement',
				'if(module.hot) {',
				' // When the styles change, update the <style> tags',
				' if(!content.locals) {',
				'   module.hot.accept(' + request + ', function() {',
				'     var newContent = require(' + request + ');',
				"     if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];",
				'     update(newContent);',
				'   });',
				' }',
				' // When the module is disposed, remove the <style> tags',
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
				'// add CSS to SSR context',
				'var add = require(' + addStylesServerPath + ').default',
				'module.exports.__inject__ = function (context) {',
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
