/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/6 15:55
 * Describe vf渲染
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// 数据类型处理工具
const {getType} = require('../../inside/lib/type')

// vf 实例读取
const {getComponent} = require('../../privateStorage');

module.exports = {
	/**
	 * vf组件渲染
	 * @param vfComponent 组件实例
	 * @param replaceNode 替换的节点
	 */
	componentRender(vfComponent, replaceNode) {
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
		
		
		
		
		console.log(vfComponent, placeholderNode,getComponent(vfComponent))
	}
}