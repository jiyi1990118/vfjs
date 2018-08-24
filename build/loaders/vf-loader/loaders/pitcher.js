const qs = require('querystring')
// webpack 规则设置工具
const RuleSet = require('webpack/lib/RuleSet')
const loaderUtils = require('loader-utils')
const hash = require('hash-sum')
const selfPath = require.resolve('../index')
const templateLoaderPath = require.resolve('./templateLoader')
const stylePostLoaderPath = require.resolve('./stylePostLoader')

// 检查是否 eslint-loader
const isESLintLoader = l => /(\/|\\|@)eslint-loader/.test(l.path)
// 检查是否 null-loader
const isNullLoader = l => /(\/|\\|@)null-loader/.test(l.path)
// 检查是否 css-loader
const isCSSLoader = l => /(\/|\\|@)css-loader/.test(l.path)
// 检查是否当前 Pitcher loader
const isPitcher = l => l.path !== __filename

// 移除 loaders中重复的 eslint-loader
const dedupeESLintLoader = loaders => {
	const res = []
	// 用于标识 eslint-loader 是否已经存在
	let seen = false
	loaders.forEach(l => {
		if (!isESLintLoader(l)) {
			res.push(l)
		} else if (!seen) {
			seen = true
			res.push(l)
		}
	})
	return res
}

module.exports = code => code

// 这个前置加载器负责拦截所有vf块请求，将其转换为适当的请求 
module.exports.pitch = function (remainingRequest) {
	
	// 获取当前loader 配置选项
	const options = loaderUtils.getOptions(this)
	// 缓存目录 、 缓存标识符
	const {cacheDirectory, cacheIdentifier} = options
	// 获取请求的资源参数
	const query = qs.parse(this.resourceQuery.slice(1))
	// 所有 loader 组成的数组 它在 pitch 阶段的时候是可以写入的 
	let loaders = this.loaders;
	
	// 避免eslint-loader被匹配
	if (query.type) {
		// 根据资源文件的路径来判断是否vf文件
		if (/\.vf$/.test(this.resourcePath)) {
			// 如果这是一个 eslint-loader ，因为整个文件本身正在被处理，
			// 移除eslint-loader以避免重复处理 
			loaders = loaders.filter(l => !isESLintLoader(l))
		} else {
			// 移除 loaders中重复的 eslint-loader
			loaders = dedupeESLintLoader(loaders)
		}
	}
	
	// 移除当前 pitcher-loader本身,避免重复处理
	loaders = loaders.filter(isPitcher)
	
	// 如果用户使用空加载器来清空类型，不需要注入
	if (loaders.some(isNullLoader)) {
		return
	}
	
	// 请求生成工具
	const genRequest = loaders => {
		// 用于拼装 loaders request字符串 （ 确保相同的loader只加载一次 ）
		const seen = new Map()
		// loader 存储
		const loaderStrings = []
		
		loaders.forEach(loader => {
			// 获取loader类型
			const type = typeof loader === 'string' ? loader : loader.path
			// 获取loader 请求的字符串
			const request = typeof loader === 'string' ? loader : loader.request
			// 检查当前 loader 是否已加载
			if (!seen.has(type)) {
				// 设置已加载标识
				seen.set(type, true)
				// 记录loader 请求的字符 如："D:\webServer\wwwroot\git.com\vfjs\build\loaders\vf-loader\index.js??vf-loader-options"
				loaderStrings.push(request)
			}
		})
		
		// 生成 loader 请求的路径  ( 此方法文档：https://github.com/webpack/loader-utils#stringifyrequest )
		return loaderUtils.stringifyRequest(this, '-!' + [
			...loaderStrings,
			// 资源文件的路径 + 资源的 query 参数 如： "?type=javascript"
			this.resourcePath + this.resourceQuery
		].join('!'))
	}
	
	// Inject style-post-loader before css-loader for scoped CSS and trimming
	if (query.type === `style`) {
		const cssLoaderIndex = loaders.findIndex(isCSSLoader)
		const {rules} = new RuleSet(options.loaders['postcss'])
		console.log('--->>>', "::::::::::::::",loaders.length,JSON.stringify(loaders))
		
		if (cssLoaderIndex > -1) {
			const afterLoaders = loaders.slice(0, cssLoaderIndex + 1)
			const beforeLoaders = loaders.slice(cssLoaderIndex + 1)
			const request = genRequest([
				...afterLoaders,
				stylePostLoaderPath,
				...beforeLoaders
			])
			
			return `import mod from ${request}; export default mod; export * from ${request}`
		}
	}
	
	// 模板：注入模板编译器和可选缓存
	if (query.type === `template`) {
		// 检查并使用缓存 loader
		const cacheLoader = cacheDirectory && cacheIdentifier
			? [`cache-loader?${JSON.stringify({
				cacheDirectory,
				cacheIdentifier: hash(cacheIdentifier) + '-vf-loader-template'
			})}`]
			: []
		const request = genRequest([
			...cacheLoader,
			templateLoaderPath + `??vf-loader-options`,
			...loaders
		])
		// 输出模版
		return `import templateOut from ${request};
		\nexport default templateOut`
	}
	
	// 如果自定义块除了vf加载器本身之外没有其他匹配加载器，
	// 我们应该忽略它
	if (query.type === `custom` &&
		loaders.length === 1 &&
		loaders[0].path === selfPath) {
		return ``
	}
	
	// 避免未匹配到vf文件处理规则，重新输出文件资源
	const request = genRequest(loaders)
	return `import mod from ${request}; export default mod; export * from ${request}`
}
