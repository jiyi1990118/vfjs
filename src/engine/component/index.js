/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/5 14:02
 * Describe javascript功能
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// 组件存储
const ComponentStorage = {};

// vf 组件 class 类
class VFComponentBase {
	
	/**
	 * 组件构造方法
	 * @param id
	 * @param script
	 */
	constructor(id, script) {
		// 组件标识
		this.__$componentId$__ = id;
		// 写入组件配置到组件存储中
		ComponentStorage[id] = {
			templates: {},
			script: script
		};
		this.exports = ComponentStorage[id];
	}
	
	// 代理方法调用（通常提供给框架内部使用）
	__ProxyMethodCall__(methodName, args) {
		const id=this.__$componentId$__;
		switch (methodName) {
			// 写入模板信息
			case 'writeTemplate':
				ComponentStorage[id].templates[args[0]] = args[1];
				break;
			// 获取模板信息
			case 'getTemplate':
				return ComponentStorage[id].templates[args[0]];
				break;
			// 设置源文件路径
			case 'setSourceFilePath':
				ComponentStorage[id].sourceFilePath = args[0];
				break;
			// 获取源文件路径
			case 'getSourceFilePath':
				return ComponentStorage[id].sourceFilePath;
				break;
		}
	}
}

module.exports = VFComponentBase;