/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/6 15:55
 * Describe vf渲染
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */
// vf 实例读取与存储
const {getVfPrivate} = require('../../privateStorage');

module.exports = function (vf, options) {
	options = options || getVfPrivate(vf);
	// 关联对应的vf组件实例
	options.componentVm = new options.VFComponent(vf, options.mountedComponent)
	console.log(vf, options)
}