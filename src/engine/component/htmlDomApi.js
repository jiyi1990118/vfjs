
module.exports =  {
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