/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/6 15:55
 * Describe vf渲染
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// 数据类型处理工具
const {getType} = require('../../inside/lib/type')

// 虚拟节点处理
const {$componentNode} = require('./vnode')

/**
 * vf组件渲染
 * @param vfComponent 组件实例
 * @param replaceNode 替换的节点
 */
function componentRender(vfComponent, replaceNode) {
	
	let placeholderNode;
	switch (getType(replaceNode)) {
		case 'undefined':
			break;
		// 是否dom选择器
		case 'string':
			placeholderNode = document.querySelector(replaceNode)
			break;
		case 'object':
			
			break;
		case 'element':
			placeholderNode = replaceNode;
			break;
	}
	
	// vf组件转换成虚拟节点
	new $componentNode(vfComponent)
	
	// 渲染
	/*
	* 根据 组件数据进行 重组成 虚拟dom结构 并创建对应的 dom元素
	* */
}

module.exports = {
	componentRender,
}