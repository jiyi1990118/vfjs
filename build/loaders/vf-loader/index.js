// loader处理工具
const loaderUtils = require('loader-utils');
// 路径处理
const path = require('path')
// 字符串请求参数处理工具
const qs = require('querystring')
// vf模板解析工具
const parse =require('../../../src/inside/utils/vf/parse')
// vf组件解析工具
const compilerParse = require('./compilerParse')

module.exports = function(source) {
	const loaderContext = this;
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
	
	
	console.log(compilerParse({
		source,
		parse,
		filename,
		sourceRoot,
		needMap: sourceMap
	}))
	
	this.callback(null,`export default {}`)
};

module.exports.raw = false;

