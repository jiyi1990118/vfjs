// 组件存储
const ComponentStorage = {};

// vf 组件 class 类
class VFComponent {
	
	/**
	 * 组件构造方法
	 * @param id
	 * @param script
	 */
	constructor(id, script) {
		this.id = id;
		this.exports = script;
	}
	
	// 写入模板信息
	writeTemplate(name, domTree) {
		ComponentStorage[this.id].templates[name] = domTree;
	}
	
	// 获取模板信息
	getTemplate(name){
		return ComponentStorage[this.id].templates[name]
	}
	
	// 设置源文件路径
	setSourceFilePath(sourceFilePath){
		ComponentStorage[this.id].sourceFilePath = sourceFilePath;
	}
	
	// 获取源文件路径
	getSourceFilePath(sourceFilePath){
		return ComponentStorage[this.id].sourceFilePath;
	}
}

export default function (id, script) {
	const options = {
		templates: {},
		script: script
	};
	
	// 写入组件配置到组件存储中
	ComponentStorage[id]=options;
	
	// 输出组件实例
	return new VFComponent(id, script);
}