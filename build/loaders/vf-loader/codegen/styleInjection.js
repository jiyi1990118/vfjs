const {attrsToQuery} = require('./utils')
const hotReloadAPIPath = './vf-hot-reload-api' || JSON.stringify(require.resolve('vf-hot-reload-api'))

module.exports = function genStyleInjectionCode(loaderContext,
                                                styles,
                                                id,
                                                options,
                                                resourcePath,
                                                stringifyRequest,
                                                needsHotReload,
                                                needsExplicitInjection) {
	// 样式引入的代码
	let styleImportsCode = ``
	// 样式注入的代码
	let styleInjectionCode = ``
	// css模块热加载代码
	let cssModulesHotReloadCode = ``
	
	// 标识是否开启css模块
	let hasCSSModules = false
	
	// css 模块名称存储
	const cssModuleNames = new Map()
	
	// 生产样式请求
	function genStyleRequest(style, i) {
		const src = style.src || resourcePath
		const attrsQuery = attrsToQuery(style.attrs, 'css')
		const inheritQuery = `&${loaderContext.resourceQuery.slice(1)}`
		// 确保只在必要时传递id，这样我们就不会注入 scoped
		const idQuery = style.scoped ? `&id=${id}` : ``
		const query = `?vf=true&type=style&index=${i}${idQuery}${attrsQuery}${inheritQuery}`
		return stringifyRequest(src + query)
	}
	
	// 生成 css 模块处理代码
	function genCSSModulesCode(style, request, i) {
		hasCSSModules = true
		
		const moduleName = style.module === true ? '$style' : style.module
		
		// 检查模块名称是否存在
		if (cssModuleNames.has(moduleName)) {
			loaderContext.emitError(`CSS module name ${moduleName} is not unique!`)
		}
		
		// 设置css模块名称
		cssModuleNames.set(moduleName, true)
		
		// `(vf-)style-loader` exports the name-to-hash map directly
		// `css-loader` exports it in `.locals`
		const locals = `(style${i}.locals || style${i})`
		const name = JSON.stringify(moduleName)
		
		// 检查当前是否服务器渲染
		if (!needsHotReload) {
			// 注入css模块
			styleInjectionCode += `this[${name}] = ${locals}\n`
		} else {
			// 热加载模式下注入的css代码
			styleInjectionCode += `
        cssModules[${name}] = ${locals}
        Object.defineProperty(this, ${name}, {
          get: function () {
            return cssModules[${name}]
          }
        })
      `
			// 热加载控制css的脚本
			cssModulesHotReloadCode += `
        module.hot && module.hot.accept([${request}], function () {
          var oldLocals = cssModules[${name}]
          if (oldLocals) {
            var newLocals = require(${request})
            if (JSON.stringify(newLocals) !== JSON.stringify(oldLocals)) {
              cssModules[${name}] = newLocals
              require(${hotReloadAPIPath}).rerender("${id}")
            }
          }
        })
      `
		}
	}
	
	// 在SSR(关键CSS集合)中需要显式注入
	// 或在阴影模式下(用于向阴影根注入)
	// 在这些模式中，vf-style-loader会使用injectStyle导出对象
	// 方法;否则我们只需要导入样式。
	
	// 检查是否需要显式注射
	if (!needsExplicitInjection) {
		// 在生产环境中只需要引入css
		styles.forEach((style, i) => {
			const request = genStyleRequest(style, i)
			styleImportsCode += `import style${i} from ${request}\n`
			// 检查是否css 模块 , 则生成 注入css模块代码
			if (style.module) genCSSModulesCode(style, request, i)
		})
	} else {
		styles.forEach((style, i) => {
			const request = genStyleRequest(style, i)
			styleInjectionCode += (
				`var style${i} = require(${request})\n` +
				`if (style${i}.injectStyle) style${i}.injectStyle(context)\n`
			)
			if (style.module) genCSSModulesCode(style, request, i)
		})
	}
	
	// console.log(styleImportsCode, '------->')
	// 是否非 css 模块化 非显式注射（服务端渲染）
	if (!needsExplicitInjection && !hasCSSModules) {
		return styleImportsCode
	}
	// style样式资源路径输出
	return `
	${styleImportsCode}
	${hasCSSModules && needsHotReload ? `var cssModules = {}` : ``}
	${needsHotReload ? `var disposed = false` : ``}
	
	function injectStyles (context) {
	  ${needsHotReload ? `if (disposed) return` : ``}
	  ${styleInjectionCode}
	}
	
	${needsHotReload ? `
	  module.hot && module.hot.dispose(function (data) {
	    disposed = true
	  })
	` : ``}
	
	${cssModulesHotReloadCode}
    `.trim()
}
