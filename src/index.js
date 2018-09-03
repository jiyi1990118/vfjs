/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/3 17:20
 * Describe javascript功能
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */


class VF {
	
	constructor() {
		console.log(arguments)
	}
	
	// 配置vf应用
	config() {
		
		return this;
	}
	
	// 启动vf框架
	start(renderFn) {
		renderFn()
		return this
	}
	
}

module.exports = VF;