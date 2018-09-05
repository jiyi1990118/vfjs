/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/3 17:20
 * Describe javascript功能
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

const VFComponentBase = require('./engine/component')

// vf实例存储索引映射
const __Vf__Storage__Index__Map__ = [];
// vf实例对应的私有数据
const __Vf__Storage__Private__Map__ = [];

// 获取vf实例私有数据
function getPrivate(vf) {
	let index = __Vf__Storage__Index__Map__.indexOf(vf);
	return __Vf__Storage__Private__Map__[index] || {};
}

class VF {
	constructor(options) {
		// 创建 vf 应用私有组件类
		class VFComponent extends VFComponentBase {
		}
		
		// 创建 vf 私有数据映射关系
		const index = __Vf__Storage__Index__Map__.push(this);
		
		const Options = {
			el: null,
			VFComponent,
			VFINDEX: index,
			config: {},
			controllers: {},
		}
		
		__Vf__Storage__Private__Map__.push(Options)
		
		// 创建组件控制操作
		this.componentAction = new componentAction(this);
		
		Object.keys(options).forEach(key => {
			switch (key) {
				case 'el':
					Options.el = options[key];
					break;
				case 'controllers':
					[].concat(options.controllers).forEach(this.addController.bind(this))
					break;
				case 'config':
					Options.config = options.config;
					break;
			}
		})
		
		console.log(getPrivate(this))
	}
	
	// 配置vf应用
	config(key, data) {
		const option = getPrivate(this);
		// 配置存储
		if (typeof key === "object") {
			Object.keys(key).forEach(function (name) {
				option.config[name] = key[name];
			})
		} else {
			if (data) {
				option.config[key] = data;
			} else {
				return option.config[key];
			}
		}
		return this;
	}
	
	
	// 启动vf框架
	start(renderFn) {
		// 获取数据类型
		const argsType = {}.toString.call(renderFn).match(/object\s+(html\w+?(Element)|(\w+))/i);
		switch (argsType[2] || argsType[1]) {
			case 'Function':
				
				break;
			// 字符串选择器
			case 'String':
				
				break;
			// option | VfComp
			case 'Object':
				
				break;
			// 渲染替代的元素·
			case 'Element':
				
				break;
			default:
			
		}
		return this
	}
	
	// 添加控制器
	addController(controller) {
		const option = getPrivate(this);
		// 存入控制器
		[].concat(controller).forEach((controller) => {
			option.controllers[controller.name] = controller;
			controller.handle.bind(this)(option.config);
		})
		return this;
	}
}

// vf实例对外开放的组件控制接口
class componentAction {
	constructor(vf) {
		this.VF = vf;
	}
	
	// 给所有组件绑定生命周期
	bindHook() {
		console.log(this)
	}
	
	// 给所有组件绑定事件
	bindEvent() {
	
	}
	
	// 给所有组件绑定通知
	bindNotify() {
	
	}
	
	// 给组件类添加原型属性（可实现全组件调用）
	addAPI(propertyName, value) {
		const option = getPrivate(this.VF);
		option.VFComponent.prototype[propertyName] = value;
	}
}

module.exports = VF;