// 此包主要对对应的模块提取并输出
module.exports = function selectBlock(compilerInfo, loaderContext, query) {
	// 模板类型
	if (query.type === `template` && query.key != null) {
		const template = compilerInfo.template[query.key];
		loaderContext.callback(
			null,
			JSON.stringify(template),
			compilerInfo.template.map
		)
		return
	}
	
	// 脚本类型
	if (query.type === `script`) {
		loaderContext.callback(
			null,
			compilerInfo.script.code,
			compilerInfo.script.map
		)
		return
	}
	
	// 样式类型
	if (query.type === `style` && query.index != null) {
		const style = compilerInfo.styles[query.index]
		loaderContext.callback(
			null,
			style.code,
			style.map
		)
		return
	}
	
	// 自定义模块类型
	if (query.type === 'custom' && query.index != null) {
		const block = compilerInfo.customBlocks[query.index]
		loaderContext.callback(
			null,
			block.content,
			block.map
		)
		return
	}
}
