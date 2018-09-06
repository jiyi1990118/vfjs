/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/6 14:19
 * Describe 私有数据存储
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// vf实例存储索引映射
const __Vf__Storage__Index__Map__ = [];
// vf实例对应的私有数据
const __Vf__Storage__Private__Map__ = [];

// 获取vf实例私有数据
function getVfPrivate(vf) {
	let index = __Vf__Storage__Index__Map__.indexOf(vf);
	return __Vf__Storage__Private__Map__[index];
}

// 存入vf私有数据
function saveVfPrivate(vf, options) {
	if (getVfPrivate(vf)) return
	// 创建 vf 私有数据映射关系
	const index = __Vf__Storage__Index__Map__.push(vf);
	options.VFINDEX = index - 1;
	__Vf__Storage__Private__Map__.push(options)
}

module.exports = {
	getVfPrivate,
	saveVfPrivate
}