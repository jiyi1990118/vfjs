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
const genStylesCode = require('./codegen/styleInjection')
// 自定义代码块请求生成工具
const genCustomBlocksCode = require('./codegen/customBlocks')
// 模板代码块请求生成工具
const genTemplateBlocksCode = require('./codegen/templateBlocks')
// 热重载代码生成
const { genHotReloadCode } = require('./codegen/hotReload')
// 组件构建工具路径
const componentBuildPath = require.resolve('./runtime/componentBuild')
// vf插件
const VfLoaderPlugin = require('./plugin');

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
	// 或在ShadowDom模式下(用于向ShadowRoot注入)
	// 在这些模式中，vf-style-loader会使用injectStyle导出对象
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
	// 标识是否启用了函数式 render渲染
	const hasFunctional = compilerInfo.template.master && compilerInfo.template.master.data.attrsMap.functional
	// 标识是否需要使用热重载开发
	const needsHotReload = (
		!isServer &&
		!isProduction &&
		(compilerInfo.script || compilerInfo.template) &&
		options.hotReload !== false
	)
	
	// 获取vf文件中的template 请求的code
	let {templateImport, templateRequestList} = genTemplateBlocksCode(
		compilerInfo.template,
		resourcePath,
		resourceQuery,
		stringifyRequest,
		hasScoped,
		inheritQuery,
		id
	)
	
	// 组件中的 javascript 片段处理
	let scriptImport = `var script = {}`
	if (compilerInfo.script) {
		const src = compilerInfo.script.src || resourcePath
		const attrsQuery = attrsToQuery(compilerInfo.script.attrs, 'js')
		const query = `?vf&type=script${attrsQuery}${inheritQuery}`
		const request = stringifyRequest(src + query);
		
		scriptImport = (
			`import script from ${request}\n` +
			// 支持指定的出口
			`export * from ${request}\n`
		)
	}
	
	// styles
	let stylesCode = ``
	if (compilerInfo.styles.length) {
		stylesCode=genStylesCode(
			loaderContext,
			compilerInfo.styles,
			id,
			options,
			resourcePath,
			stringifyRequest,
			// 需要热重载
			needsHotReload,
			// 是否需要需要显式注射
			isServer || isShadow
		)
	}
	
	let code = `
	// 组件javascript 资源引入
	${scriptImport}
	// style样式引入
	${stylesCode}
	/* build component */
	import componentBuild from ${stringifyRequest(`!${componentBuildPath}`)}
	// 组件构建
	var component = componentBuild(
		${JSON.stringify(id)},
		// 组件javascript
		script,
		// 标识是否启用了无上下文 render渲染
		${hasFunctional ? `true` : `false`},
		// 检查是否样式注入
		${/injectStyles/.test(stylesCode) ? `injectStyles` : `null`},
		// 标识 style 是否启用scope
		${hasScoped ? JSON.stringify(id) : `null`},
		// 标识是否服务端渲染
		${isServer ? JSON.stringify(hash(request)) : `null`}
		${isShadow ? `,true` : ``}
	)
	// 模板资源
	${templateImport}
    `.trim() + `\n`
	
	// 自定义模块 请求生成并写入资源
	if (compilerInfo.customBlocks && compilerInfo.customBlocks.length) {
		code += genCustomBlocksCode(
			compilerInfo.customBlocks,
			resourcePath,
			resourceQuery,
			stringifyRequest
		)
	}
	
	
	// 检查是否需要热重载
	if (needsHotReload) {
		// code += `\n` + genHotReloadCode(id, hasFunctional, templateRequestList)
	}
	
	// 设置组件源文件路径，用于调试提示
	if (!isProduction) {
		code += `\ncomponent.setSourceFilePath( ${JSON.stringify(rawShortFilePath)})`
	}
	// 对外输出组件
	code += `\nexport default component`
	return code
};

module.exports.raw = false;

module.exports.VfLoaderPlugin = VfLoaderPlugin


