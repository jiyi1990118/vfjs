import VF from '../src';

import app from './app.vf';

console.time();

console.log('app.vf out ---->>>', app)

console.timeEnd();


new VF({
	// 组件渲染位置
	el: '',
	// 控制器
	controller: [
		// 路由控制器
		function (config) {
			// 获取路由配置
			const routerConf = config.router;
			
			// 当前路由信息存储
			let routerInfo = routerConf;
			
			// 给vf实例添加方法
			this.addMethods('setRouter',function () {
				
			})
			
			// 读取/写入默认路由配置
			this.omponent.addMethod('setRouter', function () {
			
			})
			
			// 给当前实例所有组件绑定自定义通知
			this.omponent.bindNotify('router', {
				// 路由更新
				update(routerInfo, vm) {
					// 获取路由视图组件
					vm.getSelectorAll('router-view').forEach((routerViewComp) => {
						// 调用路由视图组件路由更新的接口
						routerViewComp.$API.routerUpdate(routerInfo, function (innerComp) {
							// 通知router-view内部组件路由有变
							innerComp.$notify('router:update', routerInfo.child)
						});
					})
				}
			})
			
			/*监听当前文档hash改变。（当前hash模式的地址）*/
			window.addEventListener('hashchange', function (e) {
				// 进行路由资源匹配
				routerInfo = {
					// 资源
					source: '',
					// 当前路径
					path: '',
					state: true,
				}
				
				// 检查路由匹配状态
				if (routerInfo.state === 2) {
					// 通知当前组件路由有变
					vfInstance.vm.$notify('router:update', routerInfo)
				}
				
			}, false);
		},
	
	],
	// 用户登录权限控制器
	function (options, vfInstance, next) {
		// 给当前实例所有组件绑定进入之前的生命周期
		vfInstance.omponent.bindHook('beforeEnter', function (to, from, next) {
			// 权限检测
			
			next()
		})
	}
})
	// 写入路由配置
	.config('router', {
		mode: 'history',
		routes: [{}]
	})
	// 启动 vf 应用
	.start((render) => {
		render(app||'#app')
	})
