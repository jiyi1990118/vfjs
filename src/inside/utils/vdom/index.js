/**
 * 虚拟Dom
 * Created by xiyuan on 17-5-9.
 */
"use strict";

import vnode from './vnode'

import toVNode from './toVNode'

import htmlDomApi from './htmlDomApi'



// 空节点
const emptyNode = vnode('', {}, [], undefined, undefined);




export default {
	// 虚拟节点创建
	vnode: vnode,
	// dom节点转虚拟节点
	node2vnode: toVNode
};