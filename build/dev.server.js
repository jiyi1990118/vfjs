var webpack = require('webpack');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpackDevServer = require('webpack-dev-server');
var config = require("./config/webpack.config.js");

// 在入口文件数组中添加两个选项
// webpack-dev-server/client?http://localhost:8888
// webpack/hot/dev-server
config
	.entry
	.index
	.unshift('webpack-dev-server/client?http://localhost:8888', 'webpack/hot/dev-server');

// 合并一个 devServer到配置文件
Object.assign(config, {
	// these devServer options should be customized in /config/index.js
	devServer: {
		clientLogLevel: 'warning',
		historyApiFallback: true,
		hot: true,
		inline: true,
		compress: true,
		host: 'localhost', // can be overwritten by process.env.HOST
		// port: 8282, // can be overwritten by process.env.PORT, if port is in use, a free one will be determined
		open: false,
		overlay: true
			? { warnings: false, errors: true }
			: false,
		publicPath:'/',
		proxy: {},
		quiet: true, // necessary for FriendlyErrorsPlugin
		watchOptions: {
			poll: false,
		},
		contentBase:config.output.publicPath,
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env':  '"development"'
		}),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
		new webpack.NoEmitOnErrorsPlugin(),
		// https://github.com/ampedandwired/html-webpack-plugin
		/*new HtmlWebpackPlugin({
			filename: 'index.html',
			template: 'index.html',
			inject: true,
			serviceWorkerLoader: `<script>${fs.readFileSync(path.join(__dirname,
				'./service-worker-dev.js'), 'utf-8')}</script>`
		}),*/
	]
})

// 编译
var compiler = webpack(config);

// 初始化一个webpack-dev-server
new webpackDevServer(compiler, {
	publicPath: config.output.publicPath,
	historyApiFallback: true,
	stats: {
		colors: true
	}
}).listen(8888, 'localhost', function (error) {
	if (error) {
		console.error(error);
	}
});