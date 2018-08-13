/**
 * 虚拟Dom
 * Created by xiyuan on 17-5-9.
 */
"use strict";

const vnode = require('./vnode')

const toVNode = require('./toVNode')

const htmlDomApi = require('./htmlDomApi')

// 空节点
const emptyNode = vnode('', {}, [], undefined, undefined);

module.exports = {
	// 虚拟节点创建
	vnode: vnode,
	// dom节点转虚拟节点
	node2vnode: toVNode
};