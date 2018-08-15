// loader处理工具
const loaderUtils = require('loader-utils');
// 用于生成资源唯一标识
const hash = require('hash-sum');
// 路径处理
const path = require('path')
// 字符串请求参数处理工具
const qs = require('querystring')
// 属性转请求参数工具
const {attrsToQuery} = require('./codegen/utils')
// vf模板解析工具
const parse = require('../../../src/inside/utils/vf/parse')
// vf组件解析工具
const compilerParse = require('./compilerParse')
// 组件模块选择工具
const selectBlock = require('./select');
// 样式代码生成工具
// const genStylesCode = require('./codegen/styleInjection')
// 自定义代码块生成工具
const genCustomBlocksCode = require('./codegen/customBlocks')
// vf插件
const VfLoaderPlugin =require('./plugin');

module.exports = function (source) {
	const loaderContext = this;
	// 上下文转请求字符方法
	const stringifyRequest = r => loaderUtils.stringifyRequest(loaderContext, r)
	const {
		target,         // 目标环境 web 、 node
		request,        // 被解析出来的 request 字符串
		minimize,       // 决定处理结果是否应该被压缩
		sourceMap,      // 布尔值标识是否开启 source map
		rootContext,    // 相对于应用程序根目录
		resourcePath,   // 资源文件的路径
		resourceQuery   // 资源的 query 参数
	} = loaderContext;
	
	// 原始请求参数
	const rawQuery = resourceQuery.slice(1)
	// 需要继承的请求参数
	const inheritQuery = `&${rawQuery}`
	// 将资源query 字符串反序列化为一个对象
	const incomingQuery = qs.parse(rawQuery)
	// 用来提取loader 上下文中 option
	// 如果this.query是字符串：
	// 尝试解析查询字符串并返回一个新对象
	// 如果它不是有效的查询字符串，则抛出
	// 如果this.query是对象，它只是返回this.query
	// 在任何其他情况下，它只是返回 null
	const options = loaderUtils.getOptions(loaderContext) || {}
	
	// 检查是否服务端渲染
	const isServer = target === 'node'
	// 在SSR(关键CSS集合)中需要显式注入
	// 或在阴影模式下(用于向阴影根注入)
	// 在这些模式中，vue-style-loader会使用__inject__导出对象
	// 方法;否则我们只需要导入样式。
	const isShadow = !!options.shadowMode
	// 检查是否生产模式
	const isProduction = options.productionMode || minimize || process.env.NODE_ENV === 'production'
	// 获取资源文件的名称
	const filename = path.basename(resourcePath)
	// 获取相对于应用程序根目录
	const context = rootContext || process.cwd()
	// 获取被解析的资源目录
	const sourceRoot = path.dirname(path.relative(context, resourcePath))
	// 组件编译信息
	const compilerInfo = compilerParse({
		source,
		parse,
		filename,
		sourceRoot,
		needMap: sourceMap
	});
	
	// 检查是否组件模块请求
	// 例如：app.vf?type=template&key=xxxxx
	if (incomingQuery.type) {
		return selectBlock(compilerInfo, loaderContext, incomingQuery)
	}
	
	// 模块id的作用域CSS &热重载
	const rawShortFilePath = path
		.relative(context, resourcePath)
		.replace(/^(\.\.[\/\\])+/, '')
	
	// 请求的路径重改
	const shortFilePath = rawShortFilePath.replace(/\\/g, '/') + resourceQuery
	
	// 资源唯一标识
	const id = hash(
		isProduction
			? (shortFilePath + '\n' + source)
			: shortFilePath
	)
	
	// 模块特征信息
	// 是否开启style 作用域
	const hasScoped = compilerInfo.styles.some(s => s.scoped);
	// 标识是否启用了无上下文 render渲染
	const hasFunctional = compilerInfo.template.master && compilerInfo.template.master.data.attrsMap.functional
	// 标识是否使用实时开发编译
	const needsHotReload = (
		!isServer &&
		!isProduction &&
		(compilerInfo.script || compilerInfo.template) &&
		options.hotReload !== false
	)
	
	// template
	let templateImport = `var render, staticRenderFns`
	let templateRequest
	let template = compilerInfo.template.master
	if (template) {
		const src = template.src || resourcePath
		const idQuery = `&key=${id}`
		const scopedQuery = hasScoped ? `&scoped=true` : ``
		const attrsQuery = attrsToQuery(template.data.attrsMap)
		const query = `?vf&type=template${idQuery}${scopedQuery}${attrsQuery}${inheritQuery}`
		const request = templateRequest = stringifyRequest(src + query)
		templateImport = `import { render, staticRenderFns } from ${request}`
	}
	
	// script
	let scriptImport = `var script = {}`
	if (compilerInfo.script) {
		const src = compilerInfo.script.src || resourcePath
		const attrsQuery = attrsToQuery(compilerInfo.script.attrs, 'js')
		const query = `?vue&type=script${attrsQuery}${inheritQuery}`
		const request = stringifyRequest(src + query)
		scriptImport = (
			`import script from ${request}\n` +
			`export * from ${request}` // support named exports
		)
	}
	
	// styles
	let stylesCode = ``
	if (compilerInfo.styles.length) {
		/*stylesCode = genStylesCode(
			loaderContext,
			compilerInfo.styles,
			id,
			resourcePath,
			stringifyRequest,
			needsHotReload,
			isServer || isShadow // needs explicit injection?
		)*/
	}
	
	let code = `
		${templateImport}
		${scriptImport}
		${stylesCode}

		/* normalize component */
		/*import normalizer from ${stringifyRequest(`!${'componentNormalizerPath'}`)}
		var component = normalizer(
		  script,
		  render,
		  staticRenderFns,
		  ${hasFunctional ? `true` : `false`},
		  ${/injectStyles/.test(stylesCode) ? `injectStyles` : `null`},
		  ${hasScoped ? JSON.stringify(id) : `null`},
		  ${isServer ? JSON.stringify(hash(request)) : `null`}
		  ${isShadow ? `,true` : ``}
		)*/
		var component={
			options:{},
			exports:''
		}
    `.trim() + `\n`
	
	if (compilerInfo.customBlocks && compilerInfo.customBlocks.length) {
		code += genCustomBlocksCode(
			compilerInfo.customBlocks,
			resourcePath,
			resourceQuery,
			stringifyRequest
		)
	}
	
	if (needsHotReload) {
		// code += `\n` + genHotReloadCode(id, hasFunctional, templateRequest)
	}
	
	// Expose filename. This is used by the devtools and vue runtime warnings.
	if (!isProduction) {
		code += `\ncomponent.options.__file = ${JSON.stringify(rawShortFilePath)}`
	}
	
	code += `\nexport default component.exports`
	console.log(code)
	return code
	// console.log(options)
	
	// return `export default ${JSON.stringify(compilerInfo)}`
	
	// this.callback(null, `export default ${JSON.stringify(compilerInfo)}`)
};

module.exports.raw = false;

module.exports.VfLoaderPlugin = VfLoaderPlugin

