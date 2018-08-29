/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/8/23 下午8:52
 * Describe vf插件 用于添加全局pitcher 来控制vf文件资源解析
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */
const qs = require('querystring')
// webpack 规则设置工具
const RuleSet = require('webpack/lib/RuleSet')

const id = 'vf-loader-plugin'
const NS = 'vf-loader'

class VfLoaderPlugin {
	apply(compiler) {
		// 添加NS标记，以便加载程序可以检测和报告缺失的插件
		if (compiler.hooks) {
			// webpack 4
			compiler.hooks.compilation.tap(id, compilation => {
				compilation.hooks.normalModuleLoader.tap(id, loaderContext => {
					loaderContext[NS] = true
				})
			})
		} else {
			// webpack < 4
			compiler.plugin('compilation', compilation => {
				compilation.plugin('normal-module-loader', loaderContext => {
					loaderContext[NS] = true
				})
			})
		}
		
		// webpack配置规则
		const rawRules = compiler.options.module.rules
		// 使用webpack的RuleSet实用程序对用户规则进行规范化,以便后续使用
		const {rules} = new RuleSet(rawRules)
		
		// 查找适用于vf文件的规则
		let vfRuleIndex = rawRules.findIndex(createMatcher(`foo.vf`))
		
		// 获取vf文件规则
		const vfRule = rules[vfRuleIndex]
		
		// 检查是否存在vf loader规则
		if (!vfRule) {
			throw new Error(
				`[VfLoaderPlugin Error] No matching rule for .vf files found.\n` +
				`Make sure there is at least one root-level rule that matches .vf or .vf.html files.`
			)
		}
		
		// 检查是否开启只使用第一个匹配规则
		if (vfRule.oneOf) {
			throw new Error(
				`[VfLoaderPlugin Error] vf-loader 15 currently does not support vf rules with oneOf.`
			)
		}
		
		// 获取 使用的规则
		const vfUse = vfRule.use
		// 检查 vf-loader 使用的位置
		const vfLoaderUseIndex = vfUse.findIndex(u => {
			return /^vf-loader|(\/|\\|@)vf-loader/.test(u.loader)
		})

		// 检查是否使用vf-loader
		if (vfLoaderUseIndex < 0) {
			throw new Error(
				`[VfLoaderPlugin Error] No matching use for vf-loader is found.\n` +
				`Make sure the rule matching .vf files include vf-loader in its use.`
			)
		}
		
		// 获取vf-loader规则配置
		const vfLoaderUse = vfUse[vfLoaderUseIndex]
		// 确保vf-loader选项具有已知的ident以便全局能够共享
		vfLoaderUse.ident = 'vf-loader-options'
		// 在模板加载器中通过使用ref查询来引用选项
		// 模板装入程序? ? vf-loader-options
		vfLoaderUse.options = vfLoaderUse.options || {}
		
		// console.log(vfLoaderUse.options)
		
		// 对于每个用户规则(除了vf规则之外)，创建一个克隆规则
		// 以*中的相应语言块为目标vf文件。
		const clonedRules = rules
			.filter(r => r !== vfRule)
			.map(cloneRule)
		
		//  全局的 pitcher (负责注入模板编译器装载器和CSS post装载器)
		const pitcher = {
			test: /\.vf/,
			// loader资源路径
			loader: require.resolve('./loaders/pitcher'),
			// 资源查询
			resourceQuery: query => {
				const parsed = qs.parse(query.slice(1))
				return parsed.vf != null
			},
			options:  vfLoaderUse.options
		}
		
		// 替换原有的规则
		compiler.options.module.rules = [
			// 新注入的loader
			pitcher,
			// 除vf-loader规则以外所有规则
			// ...clonedRules,
			// 原有的规则
			...rules
		]
		
		// console.log(JSON.stringify(compiler.options.module.rules))
	}
}

// 创建loader规则匹配器
function createMatcher(fakeFile) {
	// 检查此文件是否符合loader规则 （用于findIndex）
	return (rule, i) => {
		// 规则克隆
		const clone = Object.assign({}, rule)
		// 在定位vf规则时，我们需要跳过“include”检查
		delete clone.include
		// 规范化规则
		const normalized = RuleSet.normalizeRule(clone, {}, '')
		return (
			!rule.enforce &&
			normalized.resource &&
			// 检查此文件是否符合loader规则
			normalized.resource(fakeFile)
		)
	}
}

// loader规则克隆工具
function cloneRule(rule) {
	const {resource, resourceQuery} = rule
	
	// 假设“test”和“resourceQuery”测试是连续执行的
	// 同步地(基于规则集的实现是这样的)，我们可以
	// 从“test”中保存正在匹配的当前资源，以便我们可以访问
	// “resourceQuery” 这确保了我们在使用规范化规则时
	// 资源检查，包含/排除匹配正确
	let currentResource
	const res = Object.assign({}, rule, {
		// 资源存储 （利用闭包原理）
		resource: {
			test: resource => {
				// 资源存储
				currentResource = resource
				return true
			}
		},
		// 资源查询
		resourceQuery: query => {
			// 资源请求的参数
			const parsed = qs.parse(query.slice(1))
			
			// 检查是否vf
			if (parsed.vf == null) {
				return false
			}
			
			// 检查资源语言是否设置
			if (resource && parsed.lang == null) {
				return false
			}
			
			// 资源路径
			const fakeResourcePath = `${currentResource}.${parsed.lang}`
			
			// 检查资源路径是否存在
			if (resource && !resource(fakeResourcePath)) {
				return false
			}
			
			// 检查资源是否存在
			if (resourceQuery && !resourceQuery(query)) {
				return false
			}
			return true
		}
	})
	
	// 检查是否开启只使用第一个匹配规则
	if (rule.oneOf) {
		// 递归克隆内部规则
		res.oneOf = rule.oneOf.map(cloneRule)
	}
	return res
}

VfLoaderPlugin.NS = NS
module.exports = VfLoaderPlugin
