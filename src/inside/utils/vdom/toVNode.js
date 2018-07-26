import htmlDomApi from "./htmlDomApi";
import vnode from "./vnode";

// dom元素转虚拟dom
export default function toVNode(node) {
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