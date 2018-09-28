/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/6 15:55
 * Describe vf渲染
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// 组件类
const {VFComponentData} = require('../../engine/component');

// vf 实例读取
const {getVfPrivate, getComponent} = require('../../privateStorage');

// 数据类型处理工具
const {getType, isInstance, isPromise} = require('../../inside/lib/type')

// 虚拟节点处理
const {vnode} = require('./vnode')

// 日志工具
const log=require('../../inside/utils/log');

/**
 * vf组件渲染
 * @param componentData 组件数据实例
 * @param replaceNode 替换的节点
 * @param vf 当前组件所属应用实例
 */
function componentRender(componentData, replaceNode, vf) {
	
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
	componentGenNode(componentData, vf).then(function (vnode) {
		console.log(vnode, ':::::')
	})
}


// 组件加载完毕后的处理
function componentLoaded(componentData, compName, componentClass, vf, key, resolve, reject) {
	// 组件实例
	const componentInstance = new componentClass(vf, componentData)
	
	// 组件私有数据
	const privateData = getComponent(componentInstance);
	
	// 组件资源
	const source = privateData.source;
	
	// 主模版
	const masterTemplateInfo = source.templates.master;
	
	// 创建虚拟节点
	resolve(vnode(compName, {
		key,
		// 应用实例
		vf: vf,
		// 作用域id
		scopedId: source.id,
		// 节点类型
		nodeType: 2,
		// 组件数据
		compInfo: {
			// 当前组件实例
			componentInstance,
			// 组件私有数据
			privateData,
		}
	}, genCompChildrenVnode(masterTemplateInfo.domTree.children, source, getVfPrivate(vf))));
}

/**
 * 组件生成虚拟节点
 * @param componentData
 * @param vf
 * @param parentNode
 * @param compName
 * @returns {Promise<any>}
 */
function componentGenNode(componentData, vf, compName, key) {
	// 当前应用组件类
	const componentClass = vf.getComponentClass();
	
	componentData = typeof componentData === "function" ? componentData() : componentData;
	
	return new Promise(function (resolve, reject) {
		// 检查是否异步组件
		if (isInstance(componentData, VFComponentData)) {
			componentLoaded(componentData, compName, componentClass, vf, key, resolve, reject)
		} else if (isPromise(componentData)) {
			componentData.then((outComp) => {
				componentLoaded(outComp.default, compName, componentClass, vf, key, resolve, reject)
			})
		} else {
			log.error('组件解析错误：', componentData)
		}
		
	})
}

/**
 * 生成虚拟节点
 * @param domTree 需要根据dom树生成真实node/vnode
 * @param source  当前组件的源数据
 * @param vfCommOption  当前组件所属vf实例私有数据
 */
function genCompChildrenVnode(domTree, source, vfCommOption) {
	
	return domTree.map(function (nodeData, index) {
		// 检查是否标签元素
		if (nodeData.tag) {
			// 获取组件标签
			const tagName = nodeData.tag.replace(/[A-Z]/g, str => '-' + str.toLowerCase());
			
			// 组件内部javascript
			const script = source.script;
			
			// 检查应用全局、当前组件中是否存在
			let component = vfCommOption.components[tagName] || (script.components || {})[tagName];
			
			// 检查当前标签是否注册为组件
			if (component) {
				return componentGenNode(component, vfCommOption.vf, tagName, index);
			}
			
			// 检查是否html标签
			if (!nodeData.isHtmlTag) {
				log.warn('源码文件:', source.sourceFilePath, '中 [', nodeData.tag, '] 组件未注册');
			}
			
			// 创建 dom元素/组件节点
			return vnode(tagName, Object.assign({
				index: index,
				// 作用域id
				scopedId: source.id,
				// 节点类型 0 文字  1 常规元素  2 组件
				nodeType: 1,
			}, nodeData.data), genCompChildrenVnode(nodeData.children, source, vfCommOption))
			
		} else {
			// 创建文本节点
			return vnode('', Object.assign({
				nodeType: 0,
				index: index,
			}, nodeData.data))
		}
	})
	
}


module.exports = {
	componentRender,
}