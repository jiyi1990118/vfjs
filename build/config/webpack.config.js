// 引入模块
var webpack = require('webpack');
var path = require('path');
var rootPath= path.resolve(__dirname, '../../'); //项目根路径

// 解析目录地址
var srcPath = path.resolve(rootPath,'./example'); // dev目录
var outPath = path.resolve(rootPath,'./dist'); // output目录

// 配置
var config = {
	entry: {
		index: [srcPath + '/main.js'] // 入口配置，支持 string|object|array，具体参考 https://doc.webpack-china.org/configuration/
	},
	output: {
		// webpack 如何输出结果的相关选项
		
		path: outPath,
		// 所有输出文件的目标路径
		// 必须是绝对路径（使用 Node.js 的 path 模块）
		
		filename: '[name].js',
		
		chunkFilename: (new Date()).getTime() + '[id].chunk.js',
		// 「入口分块(entry chunk)」的文件名模板
		
		publicPath: outPath
		// 输出解析文件的目录，url 相对于 HTML 页面
	},
	mode: 'development',
	// module: {
	//
	// 	// 加载器
	// 	loaders: [
	// 		/*{
	// 			include: srcPath,
	// 			loader: 'babel-loader'
	// 		}*/
	// 	]
	// },
	//
	// // 插件
	// plugins: [new webpack.HotModuleReplacementPlugin()]
};

module.exports = config;