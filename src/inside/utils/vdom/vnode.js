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
export default function vnode(tag, data, children, text, elm, callbackFn) {
	
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
		// 上下文环境 ( 模型数据、过滤器、组件、指令、动态计算属性 )
		environment: {},
		// 子Vdom
		children: children,
		// 父虚拟节点
		parentVnode: null
	};
	
	const Vnode = new $vnode(conf);
	
	typeof callbackFn === "function" && callbackFn(Vnode);
	
	return Vnode;
}
