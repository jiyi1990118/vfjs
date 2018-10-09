// 数据类型处理工具
const {isPromise} = require('../../inside/lib/type')

// 日志工具
const log=require('../../inside/utils/log');

// dom处理工具
const domApi = require('./htmlDomApi');

//虚拟节点对象
class $vnode {
	// 构造函数
	constructor(conf) {
		// 配置属性继承
		Object.keys(conf).forEach(key => {
			this[key] = conf[key];
		})
		
		// 给子元素关联父元素
		this.initChildrenParent();
		
		// 创建当前节点dom  节点类型 0 文字  1 常规元素  2 组件 3 常规元素 + 指令  4 组件 + 指令
		switch (conf.data.nodeType) {
			case 0:
				this.elm = domApi.createTextNode('--text--')
				break;
			case 1:
				this.elm = domApi.createElement(this.tag);
				this.elm.appendChild(this.containFrag);
				delete this.containFrag
				break;
			case 2:
				
				
				break;
			case 3:
				
				break;
			case 4:
				
				break;
			
		}
	}
	
	// 初始化子级元素关联父元素
	initChildrenParent() {
		// dom临时容器
		this.containFrag = document.createDocumentFragment();
		// 遍历子元素并关联上容器元素
		(this.children || []).forEach((vnode, index) => {
			vnode.parentNode = this;
			// 检查当前子节点是否 异步节点
			if (isPromise(vnode)) {
				vnode.then((Vnode) => {
					if (this.children.indexOf(vnode) === -1) return
					Vnode.parentNode = this;
					// 在指定的索引位置添加节点
					this.insertIndexChild(index, Vnode);
					this.children[index] = Vnode;
				})
			} else {
				this.containFrag.appendChild(vnode.getElement());
			}
			
		})
	}
	
	// 添加子元素
	appendChild(...vnode) {
		let children = this.children;
		let index = children.length - 1;
		
		[...vnode].forEach((vnode, cindex) => {
			//  从之前节点中移除
			this.removeInParentChildrenData(vnode);
			vnode.parentNode = this;
			// 检查当前子节点是否 异步节点
			if (isPromise(vnode)) {
				let _index = cindex + index;
				vnode.then((Vnode) => {
					if (!this.inChildren(vnode, Vnode)) return
					Vnode.parentNode = this;
					this.replaceIndexChild(_index, Vnode)
					this.children[_index] = Vnode;
				})
			} else {
				this.getElement().appendChild(vnode.getElement())
			}
		});
		
		// 添加到子节点数据中
		children.push(...vnode);
	}
	
	// 删除元素
	removeChild(...vnode) {
		[...vnode].forEach(vnode => {
			if (!isPromise(vnode)) {
				// 移除真实元素
				this.getElement().removeChild(vnode.getElement())
			}
			delete vnode.parentNode;
			//  从之前节点中移除
			vnode.removeInParentChildrenData();
		})
	}
	
	// 在已有节点前添加新的节点
	insertBefore(...vnode) {
		let parentVnode = this.parentNode;
		if (!parentVnode) log.warn('节点未关联~', this)
		let children = parentVnode.children;
		let len = children.length;
		let nextUseVnode = undefined;
		let index = children.indexOf(this);
		
		// 获取下一个可用节点（已生成dom）
		while (index < len && !nextUseVnode) {
			let vnode = children[index++];
			nextUseVnode = !isPromise(vnode) && vnode;
		}
		
		// 添加到同级兄弟节点数据中
		children.splice(index, 0, ...vnode);
		
		// 获取父元素真实DOM节点
		const parentNode = parentVnode.getElement();
		
		if (nextUseVnode) {
			vnodeInsertHandle(this, index, function (vnode) {
				parentNode.insertBefore(vnode.getElement(), nextUseVnode.getElement())
			}, ...vnode);
		} else {
			vnodeInsertHandle(this, index, function (vnode) {
				parentNode.appendChild(vnode.getElement())
			}, ...vnode);
		}
	}
	
	// 在子节点指定的索引位置添加节点
	insertIndexChild(index, ...vnode) {
		let children = this.children;
		let len = children.length;
		let nextUseVnode = undefined;
		// 获取父元素真实DOM节点
		const parentNode = this.getElement();
		
		// 获取下一个可用节点（已生成dom）
		while (index < len && !nextUseVnode) {
			let vnode = children[index++];
			nextUseVnode = !isPromise(vnode) && vnode;
		}
		
		children.splice(index, 0, ...vnode);
		
		if (nextUseVnode) {
			vnodeInsertHandle(this, index, function (vnode) {
				parentNode.insertBefore(vnode.getElement(), nextUseVnode.getElement())
			}, ...vnode);
		} else {
			vnodeInsertHandle(this, index, function (vnode) {
				parentNode.appendChild(vnode.getElement())
			}, ...vnode);
		}
	}
	
	// 替换指定索引位置元素
	replaceIndexChild(index, ...vnode) {
		let children = this.children;
		let oldVnode = children[index];
		
		if (oldVnode) {
			isPromise(oldVnode) || this.getElement().removeChild(oldVnode.getElement())
			delete oldVnode.parentNode;
		}
		// 添加到同级兄弟节点数据中
		children.splice(index, 1);
		// 进行元素添加
		this.insertIndexChild(index, ...vnode);
	}
	
	// 返回指定节点之后紧跟的节点，在相同的树层级中
	nextSibling() {
		if (!this.parentNode) log.warn('节点未关联~', this)
		const siblingNode = this.parentNode.children;
		const positionIndex = siblingNode.indexOf(this);
		return positionIndex === -1 ? undefined : siblingNode[positionIndex + 1];
	}
	
	// 获取元素真实Dom元素
	getElement() {
		const elm = this.elm || this.containFrag;
		if (this.parentNode) {
			delete this.containFrag;
		}
		return elm;
	}
	
	// 从子元素中添加/删除子元素，然后返回被删除的子元素
	spliceChild(index, howmany, ...vnode) {
		const elm = this.getElement();
		const children = this.children;
		const berforeChild = children.slice(0, index);
		const afterChild = children.slice(index + howmany);
		
		// 删除对应的元素
		while (howmany--) {
			this.removeChild(children[index + howmany])
		}
		
		this.children = berforeChild.concat([...vnode], afterChild);
		
		// 获取当前处理的虚拟节点
		let nowVnode = berforeChild.reduce((nowVnode, vnode) => {
			return isPromise(vnode) ? nowVnode : vnode
		}, null);
		
		let containFrag = document.createDocumentFragment();
		
		// 添加对应的
		[...vnode].forEach((vnode, cindex) => {
			//  从之前节点中移除
			this.removeInParentChildrenData(vnode);
			vnode.parentNode = this;
			// 检查当前子节点是否 异步节点
			if (isPromise(vnode)) {
				let _index = cindex + index;
				vnode.then((Vnode) => {
					if (!this.inChildren(vnode, Vnode)) return
					Vnode.parentNode = this;
					this.replaceIndexChild(_index, Vnode)
					this.children[_index] = Vnode;
				})
			} else {
				containFrag.appendChild(vnode.getElement())
			}
		})
		
		// 添加新增的元素(真实DOM操作)
		nowVnode ? elm.insertBefore(containFrag, nowVnode.nextSibling().getElement()) : elm.appendChild(containFrag);
	}
	
	// 从子元素中移除对应节点数据
	removeInParentChildrenData(vnode) {
		vnode = vnode || this;
		let parentNode = vnode.parentNode;
		//  从之前节点中移除
		if (parentNode) {
			let oldParentChild = parentNode.children;
			oldParentChild.splice(oldParentChild.indexOf(vnode), 1)
		}
	}
	
	// 检查异步节点是否存在于当前容器中
	inChildren(vnode, Vnode) {
		return !(this.children.indexOf(vnode) === -1 && this.children.indexOf(Vnode) === -1)
	}
	
	
	// 节点销毁
	destroy() {
	
	}
	
}

//虚拟节点构造
function vnode(tag, data, children, parentNode, elm, callbackFn) {
	
	var index = data === undefined ? undefined : data.index;
	var conf = {
		// 标签
		tag: tag,
		// dom元素
		elm: elm,
		// 索引标识
		index: index,
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
	vnode
}

// 进行节点添加遍历处理
function vnodeInsertHandle(This, index, fn, ...vnode) {
	[...vnode].forEach((vnode, cindex) => {
		//  从之前节点中移除
		This.removeInParentChildrenData(vnode);
		vnode.parentNode = This;
		// 检查当前子节点是否 异步节点
		if (isPromise(vnode)) {
			let _index = cindex + index;
			vnode.then((Vnode) => {
				if (!This.inChildren(vnode, Vnode)) return
				Vnode.parentNode = This;
				This.replaceIndexChild(_index, Vnode)
				This.children[_index] = Vnode;
			})
		} else {
			fn(vnode);
		}
	})
}
