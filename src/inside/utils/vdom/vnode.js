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
	resetChildrenParent(){
		(this.children||[]).forEach(vnode=>{
			vnode.parentVnode=this;
		})
	}
	
	
	// 节点销毁
	destroy() {
	
	}
	
}


//虚拟节点构造
module.exports = function vnode(tag, data, children, text, elm, callbackFn) {
	
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
		children: children||[],
		// 父虚拟节点
		parentVnode: undefined
	};
	
	const Vnode = new $vnode(conf);
	
	typeof callbackFn === "function" && callbackFn(Vnode);
	
	return Vnode;
}
