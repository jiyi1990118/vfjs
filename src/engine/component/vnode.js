// vf 实例读取
const {getVfPrivate, getComponent} = require('../../privateStorage');

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
			vnode.parentVnode = this;
		})
	}
	
	
	// 节点销毁
	destroy() {
	
	}
	
}

class $componentNode {
	constructor(vfComponent) {
		
		// 组件私有数据
		const privateData = getComponent(vfComponent);
		
		// 组件资源
		const source = privateData.source;
		
		// 当前组件vf实例
		const vf = privateData.VF;
		
		// 主模版
		const masterTemplateInfo = source.templates.master;
		
		// 作用域id
		this.scopedId = source.id;
		
		// 生成虚拟节点
		this.children = genCompVnode(masterTemplateInfo.domTree.children, source, getVfPrivate(vf))
	}
}

/**
 * 生成虚拟节点
 * @param domTree 需要根据dom树生成真实node/vnode
 * @param source  当前组件的源数据
 * @param vfCommOption  当前组件所属vf实例私有数据
 */
function genCompVnode(domTree, source, vfCommOption) {
	
	console.log(domTree, source, vfCommOption)
	
}


//虚拟节点构造
function vnode(tag, data, children, text, elm, callbackFn) {
	
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
		data: data || {},
		// 内部上下文环境 ( 组件内部调用的方法、数据 )
		context: undefined,
		// 子Vdom
		children: children || [],
		// 父虚拟节点
		parentVnode: undefined
	};
	
	const Vnode = new $vnode(conf);
	
	typeof callbackFn === "function" && callbackFn(Vnode);
	
	return Vnode;
}

module.exports = {
	$vnode,
	$componentNode,
	vnode
}
