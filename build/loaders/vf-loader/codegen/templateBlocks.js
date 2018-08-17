const qs = require('querystring')
const {attrsToQuery} = require('./utils')

// template模块请求生产工具
module.exports = function genTemplateBlocksCode(templates,
                                                resourcePath,
                                                resourceQuery,
                                                stringifyRequest,
                                                hasScoped,
                                                inheritQuery,
                                                id
) {
	let templateRequestList = [];
	return {
		templateRequestList,
		// 遍历 templates 生成引入的请求
		templateImport: `\n/* Template blocks */\n` + Object.keys(templates).map(name => {
			let template = templates[name];
			let src = template.src || resourcePath
			let idQuery = `&id=${id}`
			let keyQuery = `&key=${name}`
			let scopedQuery = hasScoped ? `&scoped=true` : ``
			let attrsQuery = attrsToQuery(template.data.attrsMap)
			let query = `?vf&type=template${idQuery}${keyQuery}${scopedQuery}${attrsQuery}${inheritQuery}`
			let request = stringifyRequest(src + query);
			
			templateRequestList.push(request);
			return (
				`import template_${name} from ${request}\n` +
				// 把组件实例当做参数传入template 返回的方法中进行关联
				`if (typeof template_${name} === 'function') template_${name}(component)`
			)
		}).join(`\n`) + `\n`
	}
}
