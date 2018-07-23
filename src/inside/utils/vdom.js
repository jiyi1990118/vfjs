/**
 * 虚拟Dom
 * Created by xiyuan on 17-5-9.
 */
"use strict";


//虚拟节点对象
class $vnode {
	// 构造函数
	constructor(conf) {
		//配置继承
		Object.keys(conf).forEach(key => {
			this[key] = conf[key];
		})
	}
	
	// 节点克隆
	clone() {
	
	}
	
	// 节点销毁
	destroy() {
	
	}
	
}

const htmlDomApi = {
	createElement: function createElement(tagName) {
		return document.createElement(tagName);
	},
	createElementNS: function createElementNS(namespaceURI, qualifiedName) {
		return document.createElementNS(namespaceURI, qualifiedName);
	},
	createTextNode: function createTextNode(text) {
		return document.createTextNode(text);
	},
	createComment: function createComment(text) {
		return document.createComment(text);
	},
	insertBefore: function insertBefore(parentNode, newNode, referenceNode) {
		referenceNode = referenceNode instanceof Array ? referenceNode[0] : referenceNode;
		
		//检查父文档片段中是否含有指定的元素
		if (parentNode instanceof DocumentFragment) {
			var i = ~0,
				child,
				isChild,
				childNodes = [].slice.call(parentNode.childNodes),
				len = childNodes.length;
			
			while (++i < len) {
				child = childNodes[i];
				if (child === referenceNode || child.contains(referenceNode)) {
					isChild = true;
					break;
				}
			}
		} else {
			isChild = parentNode.contains(referenceNode) ? true : false;
		}
		
		referenceNode = isChild ? referenceNode : null;
		
		newNode instanceof Array ? newNode.forEach(function (child, key) {
			parentNode.insertBefore(child, referenceNode);
		}) : parentNode.insertBefore(newNode, referenceNode);
	},
	removeChild: function removeChild(node, child) {
		if (!node) return
		child instanceof Array ? child.forEach(function (child) {
			node.removeChild(child);
		}) : node.removeChild(child);
	},
	appendChild: function appendChild(node, child) {
		child instanceof Array ? child.forEach(function (child) {
			node.appendChild(child);
		}) : node.appendChild(child);
	},
	parentNode: function parentNode(node) {
		node = node instanceof Array ? parentNode(node[0]) : node
		return node ? node.parentNode : null;
	},
	replaceChild: function (parentNode, newNode, oldNode) {
		var Rm;
		if (newNode instanceof Array) {
			var doc = document.createDocumentFragment();
			newNode.forEach(function (elm) {
				doc.appendChild(elm)
			})
			newNode = doc;
		}
		
		if (oldNode instanceof Array) {
			Rm = oldNode;
			oldNode = Rm.shift();
			Rm.forEach(function (elm) {
				parentNode.removeChild(elm);
			})
		}
		parentNode.replaceChild(newNode, oldNode);
	},
	nextSibling: function nextSibling(node) {
		return node && node.nextSibling;
	},
	tagName: function tagName(elm) {
		return elm.tagName;
	},
	setTextContent: function setTextContent(node, text) {
		node.textContent = text;
	},
	getTextContent: function getTextContent(node) {
		return node.textContent;
	},
	isElement: function isElement(node) {
		return node.nodeType === 1;
	},
	isText: function isText(node) {
		return node.nodeType === 3;
	},
	isComment: function isComment(node) {
		return node.nodeType === 8;
	}
};

// 空节点
const emptyNode = vnode('', {}, [], undefined, undefined);

//转换dom元素为虚拟节点
function emptyNodeAt(elm) {
	const id = elm.id ? '#' + elm.id : '';
	const c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
	return vnode(htmlDomApi.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
}

// dom元素转虚拟dom
function toVNode(node) {
	let text;
	
	// 检查是否dom 元素
	if (htmlDomApi.isElement(node)) {
		// const id = node.id ? '#' + node.id : '';
		// const cn = node.getAttribute('class');
		// const c = cn ? '.' + cn.split(' ').join('.') : '';
		// const sel = htmlDomApi.tagName(node).toLowerCase() + id + c;
		const attrs = [].slice.call(node.attributes).reduce(function (attrs, attr) {
			let name = attr.nodeName;
			// if (name !== 'id' && name !== 'class') {
			attrs[name] = attr.nodeValue;
			// }
			return attrs;
		}, {})
		
		const children = [].slice.call(node.childNodes).map(function (ele) {
			return toVNode(ele);
		})
		
		return vnode(htmlDomApi.tagName(node), {attrs}, children, undefined, node);
		// 检查是否文本节点
	} else if (htmlDomApi.isText(node)) {
		text = htmlDomApi.getTextContent(node);
		return vnode(undefined, undefined, undefined, text, node);
		// 检查是否注释
	} else if (htmlDomApi.isComment(node)) {
		text = htmlDomApi.getTextContent(node);
		return vnode('!', {}, [], text, node);
	} else {
		return vnode('', {}, [], undefined, node);
	}
}

//虚拟节点构造
function vnode(tag, data, children, text, elm) {
	
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
	
	return new $vnode(conf);
}

export default {
	// 虚拟节点创建
	vnode: vnode,
	// dom节点转虚拟节点
	node2vnode: toVNode
};



