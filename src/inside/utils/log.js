

export default {
	// 错误日志
	error(...errs){
		console.warn(...errs)
	},
	
	// 警示日志
	warn(...content){
		console.warn(...content)
	},
	
	// 正常日志
	normal(...content){
		console.log(...content)
	}
	
	
	
}