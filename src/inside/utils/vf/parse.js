const HTML2VDom = require('../HTML2VDom');

/**
 * 用来解析vf文件内容 进行输出
 * @param pageStr
 * @returns {{}}
 */
module.exports = function (pageStr) {
	// 页面模块信息
	const pageModelInfo = {
		styles: [],
		script: null,
		template: {},
		customBlocks: {}
	};
	// 解析获取页面内容得到页面结构
	const pageNodeStruct = HTML2VDom(pageStr, 'vf');
	// 提取 template / script / style 等标签
	[].concat(pageNodeStruct).forEach(function (vnode) {
		let tag = vnode.tag;
		let children = vnode.children;
		let attrsMap = vnode.data.attrsMap;
		
		switch (tag) {
			case 'style':
				// 序列化style数据结构
				pageModelInfo.styles.push({
					lang: attrsMap.lang ? attrsMap.lang.value : 'css',
					scoped: !!attrsMap.scoped,
					code: children[0] ? children[0].text : ''
				});
				break;
			case 'script':
				// 序列化脚本数据结构
				pageModelInfo.script = {
					type: attrsMap.type ? attrsMap.type.value.replace(/^text\//i, '') : 'javascript',
					code: children[0] ? children[0].text : ''
				};
				break;
			case 'template':
				// 序列化 html模板数据结构
				pageModelInfo.template[attrsMap.name ? attrsMap.name.value : 'default'] = children;
				break;
			default:
				// 其余类型模块先存储起来
				(pageModelInfo.customBlocks[tag] = pageModelInfo.customBlocks[tag] || []).push(vnode);
		}
		
	})
	
	return pageModelInfo
}