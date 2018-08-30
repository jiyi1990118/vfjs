// 用于生成资源唯一标识
const hash = require('hash-sum');
// node内存缓存工具 https://github.com/isaacs/node-lru-cache
const cache = require('lru-cache')(300);
// 资源映射生成工具
const {SourceMapGenerator} = require('source-map');
// 换行分割正则
const splitRE = /\r?\n/g;
// 空格分割正则
const emptyRE = /^(?:\/\/)?\s*$/;


// sourceMap生成工具
function generateSourceMap(filename, source, generated, sourceRoot) {
	// 代码行数偏移
	const offsetRowLine = source.substr(0, source.indexOf(generated)).split(splitRE).length;
	const map = new SourceMapGenerator({
		file: filename,
		sourceRoot
	});
	map.setSourceContent(filename, source);
	// 进行sourceMap信息处理
	generated.split(splitRE).forEach((line, index) => {
		if (!emptyRE.test(line)) {
			map.addMapping({
				source: filename,
				original: {
					line: index + offsetRowLine,
					column: 0
				},
				generated: {
					line: index + 1,
					column: 0
				}
			});
		}
	});
	return map.toJSON();
}


// 组件解析
module.exports = function compilerParse(options) {
	const {source, filename = '', parse, compilerParseOptions = {pad: 'line'}, sourceRoot = process.cwd(), needMap = true} = options;
	// 生成缓存key标识
	const cacheKey = hash(filename + source);
	// 尝试从缓存中获取文件资源数据
	let output = cache.get(cacheKey);
	if (output) return output;
	// vf组件解析
	output = parse(source, compilerParseOptions);
	// 检查是否需要开启sourceMap
	if (needMap) {
		if (output.script && !output.script.src) {
			output.script.map = generateSourceMap(filename, source, output.script.code, sourceRoot);
		}
		if (output.styles) {
			output.styles.forEach(style => {
				if (!style.src) {
					console.log( style.code,'\n>>>>>>>>>>>>>>>>')
					console.log(source)
					style.map = generateSourceMap(filename, source, style.code, sourceRoot);
				}
			});
		}
	}
	// 更新缓存
	cache.set(cacheKey, output);
	return output;
}
