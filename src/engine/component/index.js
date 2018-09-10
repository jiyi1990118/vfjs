/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/5 14:02
 * Describe javascript功能
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// vf 实例读取
const {getVfPrivate, getComponent, saveComponent} = require('../../privateStorage');

// 组件数据类
class VFComponentData {
	/**
	 * 组件构造方法
	 * @param id
	 * @param script
	 */
	constructor(id, script) {
		this.id = id;
		this.useCount = 0;
		this.script = script;
		this.templates = {};
	}
	
	// 代理方法调用（通常提供给框架内部使用）
	__ProxyMethodCall__(methodName, args) {
		switch (methodName) {
			// 写入模板信息
			case 'writeTemplate':
				this.templates[args[0]] = args[1];
				break;
			// 获取模板信息
			case 'getTemplate':
				return this.templates[args[0]];
				break;
			// 设置源文件路径
			case 'setSourceFilePath':
				this.sourceFilePath = args[0];
				break;
			// 获取源文件路径
			case 'getSourceFilePath':
				return this.sourceFilePath;
				break;
		}
	}
}

// vf 组件基础 class 类
class VFComponentBase {
	
	/**
	 * 组件构造方法
	 * @param id
	 * @param script
	 */
	constructor(vf, componentData) {
		// 组件标识
		const id = this.__$componentId$__ = componentData.id + ':' + ++componentData.useCount;
		// 写入组件配置到组件存储中
		saveComponent(id, Object.assign({
			VF: vf
		}, componentData))
	}
	
	// 获取当前组件的vf实例
	$getVf() {
		return getComponent(this.__$componentId$__).VF;
	}
	
	// 获取当前组件中匹配到的所有元素
	$getSelectorAll() {
	
	}
	
	// 内部组件消息通知发送
	$notify() {
	
	}
	
	// 给组件绑定通知事件
	$bindNotify() {
	
	}
	
	// 定义/埋点组件自定义的生命周期(实际就是调用指定的生命周期)
	$defineHook(name, fn) {
		const vfOptions = getVfPrivate(this.$getVf());
		// vf中组件公共的hook
		const componetCommHooks = vfOptions ? vfOptions.componetCommOption.hooks[name] || [] : [];
		const script = getComponent(this.__$componentId$__).script;
		// 当前组件私有hook
		const hook = (script.hooks || {})[name];
		const hooks = hook ? componetCommHooks.concat(hook) : componetCommHooks;
		
		return new Promise(function (resolve, reject) {
			hooksHandle(hooks, fn, resolve, reject);
		})
	}
}

module.exports = {
	VFComponentBase,
	VFComponentData
};

// 生命周期
function hooksHandle(hooks, fn, resolve, reject) {
	let hook = hooks.shift();
	if (hook) {
		fn(hook, function (isPass) {
			if (!isPass) {
				reject()
			} else {
				hooksHandle(hooks, fn, resolve, reject)
			}
		})
	}
	resolve()
}