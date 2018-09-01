// 后期绑定
var Vf
var version
// vf 热编译存储
var map = (window.__VF_HOT_MAP__ = Object.create(null))
// 安装标识
var installed = false
// 是否 Browserify 模块打包工具
var isBrowserify = false
// 初始化的生命周期名称
var initHookName = 'beforeCreate'

// 关联安装vf框架
exports.install = function (vf, browserify) {
	if (installed) {
		return
	}
	// 标识
	installed = true
	
	// 获取 vf 框架
	Vf = vf.__esModule ? vf.default : vf
	// vf 框架版本号
	version = Vf.version.split('.').map(Number)
	
	isBrowserify = browserify
	
	// compat with < 2.0.0-alpha.7
	if (Vf.config._lifecycleHooks.indexOf('init') > -1) {
		initHookName = 'init'
	}
	
	// 检查是否兼容的版本
	exports.compatible = version[0] >= 2
	if (!exports.compatible) {
		console.warn(
			`[HMR] 您正在使用一个版本的vf-hot-reload-api，它只有与Vf兼容。js核心^ 2.0.0版本`
		)
		return
	}
}

/**
 * 为热加载模块创建一条组件记录，便于其他地方调用其构造函数和实例
 *
 * @param {String} id
 * @param {Object} options
 */

exports.createRecord = function (id, options) {
	if (map[id]) {
		return
	}
	
	var Ctor = null
	if (typeof options === 'function') {
		Ctor = options
		options = Ctor.options
	}
	// 将组件选项对象设置为热编译
	makeOptionsHot(id, options)
	
	// 记录组件信息
	map[id] = {
		Ctor: Ctor,
		options: options,
		instances: []
	}
}

/**
 * 检查此记录是否一个组件模块
 *
 * @param {String} id
 */

exports.isRecorded = function (id) {
	return typeof map[id] !== 'undefined'
}

/**
 * 将组件选项对象设置为热编译
 *
 * @param {String} id
 * @param {Object} options
 */

function makeOptionsHot(id, options) {
	// 是否个性化非模版渲染
	if (options.functional) {
		var render = options.render
		
		options.render = function (h, ctx) {
			var instances = map[id].instances
			if (ctx && instances.indexOf(ctx.parent) < 0) {
				instances.push(ctx.parent)
			}
			return render(h, ctx)
		}
	} else {
		// 挂载组件初始化的钩子（创建实例之前）
		injectHook(options, initHookName, function () {
			var record = map[id]
			if (!record.Ctor) {
				record.Ctor = this.constructor
			}
			record.instances.push(this)
		})
		// 挂载组件销毁之前的钩子
		injectHook(options, 'beforeDestroy', function () {
			var instances = map[id].instances
			instances.splice(instances.indexOf(this), 1)
		})
	}
}

/**
 * 向可热加载的组件注入一个钩子，方便可以跟踪它。
 *
 * @param {Object} options
 * @param {String} name
 * @param {Function} hook
 */

function injectHook(options, name, hook) {
	var existing = options[name]
	options[name] = existing
		? Array.isArray(existing) ? existing.concat(hook) : [existing, hook]
		: [hook]
}

// 尝试调用（检查是否报错）
function tryWrap(fn) {
	return function (id, arg) {
		try {
			fn(id, arg)
		} catch (e) {
			console.error(e)
			console.warn(
				'Vf组件热重加载过程中出现问题，需要完全重新加载！'
			)
		}
	}
}

function updateOptions(oldOptions, newOptions) {
	for (var key in oldOptions) {
		if (!(key in newOptions)) {
			delete oldOptions[key]
		}
	}
	for (var key$1 in newOptions) {
		oldOptions[key$1] = newOptions[key$1]
	}
}

// 重新渲染
exports.rerender = tryWrap(function (id, options) {
	var record = map[id]
	if (!options) {
		record.instances.slice().forEach(function (instance) {
			instance.$forceUpdate()
		})
		return
	}
	if (typeof options === 'function') {
		options = options.options
	}
	if (record.Ctor) {
		record.Ctor.options.render = options.render
		record.Ctor.options.staticRenderFns = options.staticRenderFns
		record.instances.slice().forEach(function (instance) {
			instance.$options.render = options.render
			instance.$options.staticRenderFns = options.staticRenderFns
			// reset static trees
			// pre 2.5, all static trees are cahced together on the instance
			if (instance._staticTrees) {
				instance._staticTrees = []
			}
			// 2.5.0
			if (Array.isArray(record.Ctor.options.cached)) {
				record.Ctor.options.cached = []
			}
			// 2.5.3
			if (Array.isArray(instance.$options.cached)) {
				instance.$options.cached = []
			}
			// post 2.5.4: v-once trees are cached on instance._staticTrees.
			// Pure static trees are cached on the staticRenderFns array
			// (both already reset above)
			instance.$forceUpdate()
		})
	} else {
		// functional or no instance created yet
		record.options.render = options.render
		record.options.staticRenderFns = options.staticRenderFns
		
		// handle functional component re-render
		if (record.options.functional) {
			// rerender with full options
			if (Object.keys(options).length > 2) {
				updateOptions(record.options, options)
			} else {
				// template-only rerender.
				// need to inject the style injection code for CSS modules
				// to work properly.
				var injectStyles = record.options._injectStyles
				if (injectStyles) {
					var render = options.render
					record.options.render = function (h, ctx) {
						injectStyles.call(ctx)
						return render(h, ctx)
					}
				}
			}
			record.options._Ctor = null
			// 2.5.3
			if (Array.isArray(record.options.cached)) {
				record.options.cached = []
			}
			record.instances.slice().forEach(function (instance) {
				instance.$forceUpdate()
			})
		}
	}
})

exports.reload = tryWrap(function (id, options) {
	var record = map[id]
	if (options) {
		if (typeof options === 'function') {
			options = options.options
		}
		makeOptionsHot(id, options)
		if (record.Ctor) {
			if (version[1] < 2) {
				// preserve pre 2.2 behavior for global mixin handling
				record.Ctor.extendOptions = options
			}
			var newCtor = record.Ctor.super.extend(options)
			record.Ctor.options = newCtor.options
			record.Ctor.cid = newCtor.cid
			record.Ctor.prototype = newCtor.prototype
			if (newCtor.release) {
				// temporary global mixin strategy used in < 2.0.0-alpha.6
				newCtor.release()
			}
		} else {
			updateOptions(record.options, options)
		}
	}
	record.instances.slice().forEach(function (instance) {
		if (instance.$vnode && instance.$vnode.context) {
			instance.$vnode.context.$forceUpdate()
		} else {
			console.warn(
				'修改根实例或手动挂载实例，需要完全重新加载！'
			)
		}
	})
})
