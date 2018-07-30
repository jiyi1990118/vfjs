// 语法原子类型
import atomType from './atomType';

/*
 * UnaryExpression 一元表达式
 * BinaryExpression 二元表达式
 * TernaryExpression 三元表达式
 * UpdateExpression 自运算
 * AssignmentExpression 分配运算
 * MemberExpression 成员表达式
 * ArrayExpression 数组表达式
 * ObjectExpression 对象表达式
 * CallExpression 方法执行表达式
 * FilterExpression 过滤器表达式
 * */

//表达式规则
export default function (expression) {
	
	//一元表达式
	expression.expUnary = function (atom, expTemp) {
		const id = atom.value,
			struct = {
				argment: null,
				operator: id,
				priority: 3,
				exp: 'UnaryExpression'
			},
			nextAtom = this.atomLex();
		
		const tmpStruct = this.expConcat(struct);
		
		this.nextExpressionLex(nextAtom, false);
		
		if (!this.expStruct) return this.throwErr('一元运算表达式不完整！');
		
		// 表达式类型
		const expType = this.expStruct.exp || this.expStruct.type;
		
		// 特殊一元运算标识 （对指定类型数据有效）
		// 只对成员数据有效
		if ('delete' === id) {
			if (expType !== 'MemberExpression'){
				return this.throwErr('delete 语法错误！',{start:this.expStruct.start -1});
			}
		}else if( 'new' === id){
			if('CallExpression' !== expType && atomType.identifier !== expType ){
				return this.throwErr('new 语法错误！',{start:this.expStruct.start -1});
			}
		}
		
		//继续检查后续表达式 并 表达式连接
		this.expStruct = this.expConcat(tmpStruct);
		
		expTemp.valueType = 'literal';
		return struct;
	}
	
	//二元表达式
	expression.expBinary = function (atom, expTemp) {
		//保存当前的表达式
		const nowStruct = this.expStruct,
			nextAtom = this.atomLex();
		
		//获取下一个语法表达式
		this.nextExpressionLex(nextAtom, false);
		
		const struct = {
			left: null,
			right: null,
			operator: atom.value,
			priority: atom.priority,
			exp: 'BinaryExpression'
		};
		
		if (!nextAtom) return this.throwErr('二元运算语法错误，右侧表达式不存在！');
		
		//连接之前的表达式
		const tmpStruct = this.expConcat(nowStruct, struct);
		
		if (!expTemp.valueType) return this.throwErr('二元表达式，右侧语法错误！', atom);
		
		//继续检查后续表达式 并 表达式连接
		this.expStruct = this.expConcat(tmpStruct, this.expStruct);
		
		expTemp.valueType = 'literal';
		return struct;
	}
	
	//三元表达式
	expression.expTernary = function (atom, expTemp) {
		const struct = {
			accord: null,
			mismatch: null,
			condition: this.expStruct,
			operator: atom.value,
			priority: atom.priority,
			exp: 'TernaryExpression'
		};
		
		this.addBlockEnd(':');
		
		this.nextExpressionLex();
		struct.accord = this.expStruct;
		
		//继续检查后续表达式并连接
		this.nextExpressionLex();
		
		struct.mismatch = this.expStruct;
		
		expTemp.valueType = 'literal'
		
		return this.expStruct = struct;
	}
	
	//自运算
	expression.expUpdate = function (atom, expTemp) {
		const struct = {
				argment: null,
				prefix: true,
				operator: atom.value,
				priority: atom.priority,
				exp: 'UpdateExpression'
			},
			nextAtom = this.atomLex();
		
		//继续检查后续表达式
		this.expressionLex(nextAtom, false);
		
		//检查之后的表达式值类型是否标识量
		if (expTemp.valueType === 'identifier') {
			struct.argment = this.expStruct;
			expTemp.valueType = 'literal';
			return this.expStruct = struct;
		}
		
		return this.throwErr('自运算后面应该是标识量!', atom);
	}
	
	//后自运算
	expression.expUpdateAfter = function (atom, expTemp) {
		
		//检查语法是否符合后自运算
		function checkExpression(expStruct) {
			switch (expStruct.exp) {
				case 'BinaryExpression':
					return checkExpression(expStruct.right);
				case 'MemberExpression':
					return expStruct;
				case 'UnaryExpression':
					return checkExpression(expStruct.argment);
				default:
					switch (expStruct.type) {
						case atomType.Keyword:
						case atomType.identifier:
							return expStruct.right;
						default:
							return expTemp.valueType === 'identifier';
					}
			}
			return false;
		}
		
		//检查当前语法
		if (!checkExpression(this.expStruct)) {
			return this.throwErr('后自运算表达式有误!', atom);
		}
		
		const struct = {
			argment: null,
			prefix: false,
			operator: atom.value,
			priority: atom.priority,
			exp: 'UpdateExpression'
		};
		
		this.expStruct = this.expConcat(struct);
		return struct;
	}
	
	//成员表达式
	expression.expMember = function (atom, expTemp) {
		let struct = {
			object: null,
			property: null,
			priority: 1,
			computed: false,
			exp: 'MemberExpression'
		};
		
		let nextAtom = this.atomLex(),
			expStruct = this.expStruct;
		
		switch (atom.value) {
			case '.':
				switch (nextAtom.type) {
					//标识量
					case atomType.Keyword:
					case atomType.identifier:
						struct.property = nextAtom;
						break;
					default:
						return this.throwErr('成员表达式语法错误')
				}
				break;
			case '[':
				struct.computed = true;
				
				this.addBlockEnd(']');
				
				this.nextExpressionLex(nextAtom);
				
				
				//还原当前处理的arguments
				this.args = this.levelArgs[this.levelArgs.length - 1];
				
				struct.property = this.expStruct;
				break;
		}
		
		expTemp.valueType = 'identifier'
		//表达式拼接
		this.expStruct = this.expConcat(expStruct, struct);
		
		if (nextAtom = this.atomLex()) {
			//检查是否后续是点或中括号来判断成员表达式
			if (nextAtom.value === '.' || nextAtom.value === '[') {
				struct = this.expMember(nextAtom, expTemp);
			} else {
				
				//检查是否方法
				if (nextAtom.value === '(') {
					struct = this.expCall(nextAtom, expTemp);
				} else {
					this.soonAtom = nextAtom;
				}
			}
		}
		return struct;
	}
	
	//数组表达式
	expression.expArray = function (atom, expTemp) {
		const struct = {
				args: null,
				exp: 'ArrayExpression',
				priority: 1
			},
			expMode = this.expMode;
		
		
		//连接之前的表达式
		const tmpStruct = this.expConcat(this.expStruct, struct);
		
		this.expMode = 'Array';
		
		this.addBlockEnd(']');
		this.nextExpressionLex();
		
		if (this.args.length) {
			struct.args = this.args;
			//防止最后一个元素是空表达式
			const last = struct.args.pop();
			if (last) {
				struct.args.push(last);
			}
		} else {
			struct.args = this.expStruct ? [this.expStruct] : [];
		}
		
		//还原当前处理的arguments
		this.args = this.levelArgs[this.levelArgs.length - 1];
		
		expTemp.valueType = 'memory';
		this.expStruct = tmpStruct;
		this.expMode = expMode;
		
		return struct;
	}
	
	//对象表达式
	expression.expObject = function (atom, expTemp) {
		const struct = {
			property: [],
			exp: 'ObjectExpression',
			priority: 1
		};
		
		//连接之前的表达式
		const tmpStruct = this.expConcat(this.expStruct, struct),
			expMode = this.expMode;
		
		expTemp.valueType = null;
		this.expStruct = null;
		
		this.addBlockEnd('}');
		
		//进入对象表达式状态
		this.expMode = 'Object';
		
		this.nextExpressionLex();
		
		//进行属性拼接
		if (this.args) {
			struct.property = this.args;
			//防止对象中最后遗留逗号
			if (this.expStruct) {
				const argLen = this.args.length;
				if (argLen !== 0) {
					this.args[argLen - 1].value = this.expStruct
				}
			}
		}
		
		expTemp.valueType = 'memory';
		this.expStruct = tmpStruct;
		
		this.expMode = expMode;
		return struct;
	}
	
	//方法执行表达式
	expression.expCall = function (atom, expTemp) {
		
		//检查方法表达式
		if (expTemp.valueType !== 'identifier' && this.expStruct.exp !== 'CallExpression') return this.throwErr('表达式不是一个方法！');
		
		let errMsg,
			brackets = expTemp.brackets,
			errAtom = this.atoms[this.atoms.length - 3];
		
		switch (expTemp.valueType) {
			case 'memory':
				errMsg = this.expStruct.exp + ' ';
			case atomType.Null:
				errMsg = errMsg || '空: ' + errAtom.value;
			case atomType.String:
				errMsg = errMsg || '字符串: ' + errAtom.value;
			case atomType.Numeric:
				errMsg = errMsg || '数字: ' + errAtom.value;
			case atomType.Boolean:
				errMsg = errMsg || '布尔值: ' + errAtom.value;
				return this.throwErr('语法错误，' + errMsg + ' 不是一个方法!', errAtom)
		}
		expTemp.brackets = 4;
		
		let struct = {
				exp: 'CallExpression',
				args: [],
				priority: 1,
				callee: null
			},
			expMode = this.expMode,
			tmpStruct = this.expConcat(struct);
		
		this.expMode = 'Call';
		
		this.addBlockEnd(')');
		this.nextExpressionLex();
		
		if (this.args.length) {
			struct.args = this.args;
			//防止最后一个元素是空表达式
			const last = struct.args.pop();
			if (last) {
				struct.args.push(last);
			}
		} else {
			struct.args = this.expStruct ? [this.expStruct] : [];
		}
		
		//还原当前处理的arguments
		this.args = this.levelArgs[this.levelArgs.length - 1];
		
		expTemp.valueType = 'literal';
		this.expStruct = tmpStruct;
		this.expMode = expMode;
		expTemp.brackets = brackets;
		
		const nextAtom = this.atomLex();
		
		if (nextAtom) {
			if (nextAtom.value === '.' || nextAtom.value === '[') {
				struct = this.expMember(nextAtom, expTemp);
			} else {
				this.soonAtom = nextAtom;
			}
		}
		
		return struct;
	}
	
	//分配表达式
	expression.expAssignment = function (atom) {
		const struct = {
			exp: 'AssignmentExpression',
			value: null,
			identifier: this.expStruct,
			operator: atom.value,
			priority: atom.priority
		};
		
		this.nextExpressionLex();
		struct.value = this.expStruct;
		
		return this.expStruct = struct;
	}
	
	//过滤表达式
	expression.expFilter = function (atom) {
		const struct = {
				exp: 'FilterExpression',
				args: [],
				operator: atom.value,
				priority: atom.priority,
				callee: null,
				lead: null
			},
			tmpStruct = this.expConcat(struct);
		
		this.nextExpressionLex(this.atomLex(), false);
		
		if (this.expStruct.exp) {
			switch (this.expStruct.exp) {
				case 'MemberExpression':
					struct.callee = this.expStruct;
					break;
				case 'CallExpression':
					struct.callee = this.expStruct.callee;
					struct.args = this.expStruct.args;
					break;
				default:
					return this.throwErr('过滤器表达式错误!')
			}
		} else {
			switch (this.expStruct.type) {
				case atomType.Keyword:
				case atomType.identifier:
					struct.callee = this.expStruct;
					break;
				default:
					return this.throwErr('过滤器数据类型错误!')
			}
		}
		
		this.expStruct = tmpStruct;
		tmpStruct.valueType = 'literal';
		
		return struct;
	}
}
