/**
 * Created By xiyuan
 * Author server@xiyuan.name (惜缘叛逆)
 * DateTime 2018/9/3 17:20
 * Describe javascript功能
 * MIT License http://www.opensource.org/licenses/mit-license.php
 */

// 组件类
const {VFComponentBase, VFComponentData} = require('./engine/component');
// vf 实例读取与存储
const {getVfPrivate, saveVfPrivate} = require('./privateStorage');
// vf应用渲染工具
const render = require('./engine/component/render');
// 数据类型处理工具
const {isInstance} = require('./inside/lib/type')

class VF {
	constructor(options) {
		// 创建 vf 应用私有组件类
		class VFComponent extends VFComponentBase {
		}
		
		const Options = {
			el: null,
			// vf组件中的组件类
			VFComponent,
			// vf 内部配置
			config: {},
			mountedComponent: null,
			// 控制器
			controllers: {},
			// 组件公共的选项
			componetCommOption: {
				hooks: {},
				events: {},
				notifys: {}
			}
		}
		
		// 保存vf数据
		saveVfPrivate(this, Options)
		
		// 创建组件控制操作
		this.componentAction = new componentAction(this);
		
		// 解析处理vf实例选项
		parseHandleVfOptions(Options, options, this)
	}
	
	// 配置vf应用
	config(key, data) {
		const option = getVfPrivate(this);
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
	start(option) {
		const Options = getVfPrivate(this);
		// 获取数据类型
		const argsType = {}.toString.call(option).match(/object\s+(html\w+?(Element)|(\w+))/i);
		switch (argsType[2] || argsType[1]) {
			case 'Function':
				option((option) => {
					this.start(option);
				});
				return this;
				break;
			// 渲染替代的元素·
			case 'Element':
			// 字符串选择器
			case 'String':
				Options.el = option;
				break;
			// option | VfComp
			case 'Object':
				if (isInstance(option, VFComponentData)) {
					Options.mountedComponent = option;
				} else {
					parseHandleVfOptions(Options, option, this)
				}
				break;
			default:
			
		}
		// 渲染处理
		render(this, Options)
		return this
	}
	
	// 添加控制器
	addController(controller) {
		const option = getVfPrivate(this);
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
	bindHook(hookName, fn) {
		const componetCommOption = getVfPrivate(this.VF).componetCommOption;
		// 写入公共的组件配置中
		componetCommOption.hooks[hookName] = (componetCommOption.hooks[hookName] || []).concat(fn)
	}
	
	// 给所有组件绑定事件
	bindEvent(eventName, fn) {
		const events = getVfPrivate(this.VF).componetCommOption.events;
		// 写入公共的组件配置中
		events[eventName] = (events[eventName] || []).concat(fn)
	}
	
	// 给所有组件绑定通知
	bindNotify(notifyType, config) {
		const notifys = getVfPrivate(this.VF).componetCommOption.notifys;
		
		
		switch (typeof config) {
			case 'function':
				notifys[notifyType] = config;
				break;
			case 'object':
				Object.keys(config).forEach(function (key) {
					notifys[(notifyType + ':' + key).replace('::', ':')] = config[key];
				})
				break;
			default:
				if (typeof notifyType === 'object') {
					Object.keys(notifyType).forEach(function (key) {
						notifys[key] = notifyType[key];
					})
				}
		}
	}
	
	// 给组件类添加原型属性（可实现全组件调用）
	addAPI(propertyName, value) {
		const option = getVfPrivate(this.VF);
		option.VFComponent.prototype[propertyName] = value;
	}
}

module.exports = VF;

/**
 * 解析处理vf实例选项
 * @param Options vf 实例私有选项
 * @param options 传入需要解析的选项
 * @param vf vf实例
 */
function parseHandleVfOptions(Options, options, vf) {
	Object.keys(options).forEach(key => {
		switch (key) {
			case 'el':
				Options.el = options[key];
				break;
			case 'controllers':
				[].concat(options.controllers).forEach(vf.addController.bind(vf))
				break;
			case 'config':
				Options.config = options.config;
				break;
			case 'render':
				options.render(function (option) {
					if (isInstance(option, VFComponentData)) {
						Options.mountedComponent = option;
					} else {
					
					}
				})
				break;
			case 'mountComponent':
				if (isInstance(options.mountComponent, VFComponentData)) {
					Options.mountedComponent = options.mountComponent;
				} else {
				
				}
				break;
		}
	})
}