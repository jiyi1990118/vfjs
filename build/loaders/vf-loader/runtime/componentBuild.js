import VFComponentBase from '../../../../src/engine/component'

export default function (id, script) {
	// 输出组件实例
	return new VFComponentBase(id, script);
}