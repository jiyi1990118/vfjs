// 获取语法输出数据类型

function getOutExpType(syntaxStruct, outExpInfo) {
	
	outExpInfo = outExpInfo || {
		// 输出的表达式类型
		outExpTypes: [],
		// 是否可写
		canWrite: true,
	};
	if (!syntaxStruct) return outExpInfo;
	
	switch (syntaxStruct.exp) {
		//三元表达式
		case 'TernaryExpression':
			// 三元表达式两种输出结果
			getOutExpType(syntaxStruct.mismatch, outExpInfo)
			getOutExpType(syntaxStruct.accord, outExpInfo)
			break;
		//一元表达式
		case 'UnaryExpression':
		//二元表达式
		case 'BinaryExpression':
		//数组表达式
		case 'ArrayExpression':
		//对象表达式
		case 'ObjectExpression':
		//方法执行表达式
		case 'CallExpression':
		//过滤器表达式
		case 'FilterExpression':
		//自运算
		case 'UpdateExpression':
		//分配运算
		case 'AssignmentExpression':
			outExpInfo.canWrite = false;
		//成员表达式
		case 'MemberExpression':
			outExpInfo.outExpTypes.push(syntaxStruct.exp)
			break;
		default:
			//原子类型
			if (syntaxStruct.type !== 'identifier') {
				outExpInfo.canWrite = false;
			}
			//原子类型
			outExpInfo.outExpTypes.push(syntaxStruct.type)
	}
	return outExpInfo;
}

module.exports = getOutExpType;