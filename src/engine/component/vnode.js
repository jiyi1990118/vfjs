// vf 实例读取
const {getVfPrivate, getComponent} = require('../../privateStorage');

// 组件类
const {VFComponentData} = require('../../engine/component');

// 数据类型处理工具
const {isInstance, isPromise} = require('../../inside/lib/type')

// 日志工具
const log = require('../../inside/utils/log')

//虚拟节点对象
class $vnode {
	// 构造函数
	constructor(conf) {
		// 配置属性继承
		Object.keys(conf).forEach(key => {
			this[key] = conf[key];
		})
		
		// 给子元素关联父元素
		this.resetChildrenParent();
		
	}
	
	// 节点克隆
	clone() {
	
	}
	
	// 给子级元素关联父元素
	resetChildrenParent() {
		(this.children || []).forEach(vnode => {
			vnode.parentNode = this;
		})
	}
	
	
	// 节点销毁
	destroy() {
	
	}
	
}

/**
 * 组件生成虚拟节点
 * @param vfComponent
 */
function componentGenNode(componentData, vf, parentNode, compName) {
	
	componentData = typeof componentData === "function" ? componentData() : componentData;
	
	return new Promise(function (resolve, reject) {
		
		// 检查是否异步组件
		if (isInstance(componentData, VFComponentData)) {
		
		} else if (isPromise(componentData)) {
			componentData.then((outComp) => {
				vfStart(this, Options, outComp.default)
			})
		}else{
			log.error('组件解析错误：',componentData)
		}
		
		
		/*// vf应用挂载的组件数据
		// 关联对应的vf组件实例
	Options.componentVm = new Options.VFComponent(vf, mountedComponent);
		const mountedComponent = Options.mountedComponent;
		
		// 检查是否异步组件
		if (isInstance(mountedComponent, VFComponentData)) {
			vfStart(this, Options, mountedComponent)
		} else if (isPromise(mountedComponent)) {
			mountedComponent.then((outComp) => {
				vfStart(this, Options, outComp.default)
			})
		}*/
		
		
		// 关联对应的vf组件实例
		// Options.componentVm = new Options.VFComponent(vf, mountedComponent);
		// 组件私有数据
		const privateData = getComponent(componentData);
		
		// 组件资源
		const source = privateData.source;
		
		// 当前组件vf实例
		const vf = privateData.VF;
		
		// 主模版
		const masterTemplateInfo = source.templates.master;
		
		// 创建虚拟节点
		return vnode(compName, {
			// 应用实例
			vf: vf,
			// 作用域id
			scopedId: source.id,
			// 节点类型
			nodeType: 2,
			// 组件数据
			compInfo: {
				// 当前组件实例
				vfComponent,
				// 组件私有数据
				privateData,
			}
		}, genCompChildrenVnode(masterTemplateInfo.domTree.children, source, getVfPrivate(vf), parentNode));
		
	})
	
	
}


/**
 * 生成虚拟节点
 * @param domTree 需要根据dom树生成真实node/vnode
 * @param source  当前组件的源数据
 * @param vfCommOption  当前组件所属vf实例私有数据
 */
function genCompChildrenVnode(domTree, source, vfCommOption, parentNode) {
	return domTree.map(function (nodeData, index) {
		// 检查是否标签元素
		if (nodeData.tag) {
			// 获取组件标签
			const tagName = nodeData.tag.replace(/[A-Z]/g, str => '-' + str.toLowerCase());
			
			// 组件内部javascript
			const script = source.script;
			
			let component = vfCommOption.components[tagName] || script.components[tagName];
			
			// 检查当前标签是否注册为组件
			if (component) {
				component = typeof component === "function" ? component() : component;
			}
			
			// 检查是否html标签
			if (!nodeData.isHtmlTag) {
				log.warn('源码文件:', source.sourceFilePath, '中 [', nodeData.tag, '] 组件未注册');
			}
			
			// 创建 dom元素/组件节点
			return vnode(tagName, Object.assign({
				key: index,
				// 作用域id
				scopedId: source.id,
				// 节点类型
				nodeType: component ? 2 : 1,
			}, nodeData.data, parentNode), genCompChildrenVnode(nodeData.children, source, vfCommOption))
			
		} else {
			// 创建文本节点
			return vnode('', Object.assign({
				key: index,
			}, nodeData.data), parentNode)
		}
	})
	
}


//虚拟节点构造
function vnode(tag, data, children, parentNode, text, elm, callbackFn) {
	
	var key = data === undefined ? undefined : data.key;
	var conf = {
		// 标签
		tag: tag,
		// dom元素
		elm: elm,
		// 文本内容
		text: text,
		// 键值标识
		key: key,
		// 数据容器
		data: data || {
			// 节点类型 0 文字  1 常规元素  2 组件
			nodeType: text ? 0 : 1,
		},
		// 内部上下文环境 ( 组件内部调用的方法、数据 )
		context: undefined,
		// 子Vdom
		children: children,
		// 父虚拟节点
		parentNode: parentNode
	};
	
	const Vnode = new $vnode(conf);
	
	typeof callbackFn === "function" && callbackFn(Vnode);
	
	return Vnode;
}

module.exports = {
	$vnode,
	componentGenNode,
	vnode
}
