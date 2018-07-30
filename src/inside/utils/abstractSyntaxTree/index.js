/**
 * 语法解析
 * Created by xiyuan on 17-4-25.
 */
"use strict";

import log from '../log';

// 表达式解析
import expression from './expression';

// 原子扫描
import atomScan from './atomScan';

// 字符检查
import strGate from './strGate';

// 语法原子类型
import atomType from './atomType';

//语法解析
function syntaxParserClass(code) {
	//代码资源
	this.source = code;
	//代码长度
	this.length = code.length;
	//扫描索引
	this.index = 0;
	//原子存储器
	this.atoms = [];
	//语法块队列存储
	this.expBlockEnd = [];
	//表达式参数记录
	this.args = [];
	//表达式层级参数
	this.levelArgs = [this.args];
	//语法表达式结构
	this.expStruct = null;
	//语法表达式处理临时数据
	this.expTemp = {
		valueType: null,
		valueExp: null
	}
	//错误信息
	this.errMsg = null;
	//表达式扫描
	this.expressionLex();
	
	//检查语法是否完整
	if (this.expBlockEnd.length && !this.errMsg) {
		this.throwErr('表达式不完整缺少' + this.expBlockEnd.length + '个闭合符号 ' + this.expBlockEnd.join(' , '))
	}
};

// 表达式解析
expression(syntaxParserClass.prototype);

//获取预处理的元素
syntaxParserClass.prototype.getSoonAtom = function () {
	var atom = this.soonAtom;
	delete this.soonAtom;
	return atom
}

//获取后面的表达式
syntaxParserClass.prototype.nextExpressionLex = function (atom, isAdopt) {
	this.expStruct = null;
	this.expTemp.valueType = null;
	return this.expressionLex(atom, isAdopt);
}

//语法块结束符号添加
syntaxParserClass.prototype.addBlockEnd = function (symbol) {
	this.expBlockEnd.push(symbol);
	//表达式层级参数
	this.levelArgs.push(this.args = []);
}

//表达式连接属性获取
syntaxParserClass.prototype.getExpAttr = function (strcut, isBefore) {
	isBefore = isBefore === undefined ? true : isBefore;
	
	//表达式类型处理
	switch (strcut.exp) {
		//自运算
		case 'UpdateExpression':
		//一元表达式
		case 'UnaryExpression':
			return 'argment';
		//二元表达式
		case 'BinaryExpression':
			return isBefore ? 'left' : 'right';
		//三元表达式
		case 'TernaryExpression':
			return isBefore ? 'condition' : 'mismatch';
		//成员表达式
		case 'MemberExpression':
			return isBefore ? 'object' : 'property';
		//数组表达式
		case 'ArrayExpression':
		//对象表达式
		case 'ObjectExpression':
			return 'self';
		//执行运算
		case 'CallExpression':
			return 'callee';
		//分配运算
		case 'AssignmentExpression':
			
			break;
		//过滤器表达式
		case 'FilterExpression':
			return 'lead';
			break;
	}
}

//表达式连接
syntaxParserClass.prototype.expConcat = function (strcut, expStruct) {
	if (!strcut) {
		return expStruct;
	}
	//连接当前表达式处理
	if (expStruct === undefined && this.expStruct) {
		expStruct = strcut;
		strcut = this.expStruct;
	}
	
	if (expStruct) {
		var attr;
		//检查是否表达式结构
		if (expStruct.exp) {
			//对比前后两个表达式的优先级
			if (!(strcut.exp && expStruct.priority < strcut.priority)) {
				attr = this.getExpAttr(expStruct);
				expStruct[attr] = this.expConcat(strcut, expStruct[attr]);
				return expStruct;
			}
		} else if (!strcut.exp) {
			return strcut;
		}
		attr = this.getExpAttr(strcut, false);
		strcut[attr] = this.expConcat(strcut[attr], expStruct);
	}
	return strcut;
}

//语法表达式扫描
syntaxParserClass.prototype.expressionLex = function (atom, isAdopt) {
	//检查语法是否出错
	if (this.errMsg) return;
	
	if (!atom) {
		if (this.soonAtom) {
			atom = this.getSoonAtom();
		} else {
			atom = this.atomLex();
		}
	}
	
	if (!atom) return;
	
	isAdopt = isAdopt === undefined ? true : isAdopt;
	
	var struct,
		nextAtom,
		brackets,
		args = this.args,
		expTemp = this.expTemp;
	
	//检查表达式值类型
	switch (expTemp.valueType) {
		
		//内存量（内部定义的数组、对象）
		case 'memory':
		//字面量
		case 'literal':
		//标识量
		case 'identifier':
			if (atom.value === '.' || atom.value === '[') {
				struct = this.expMember(atom, expTemp);
				nextAtom = this.getSoonAtom();
				break;
			}
			if (expTemp.valueType !== 'literal') {
				if (atom.identity === 'assignment') {
					struct = this.expAssignment(atom, expTemp);
					break;
				}
			}
		
		case atomType.Null:
		case atomType.String:
		case atomType.Numeric:
		case atomType.Boolean:
			switch (atom.type) {
				case atomType.Punctuator:
					switch (atom.identity) {
						//二元运算符
						case 'single':
						case 'complex':
						case 'logical':
						case 'bitwise':
							struct = this.expBinary(atom, expTemp);
							break;
						//三元运算
						case 'interrogation':
							struct = this.expTernary(atom, expTemp);
							break;
						//自运算
						case 'update':
							struct = this.expUpdateAfter(atom, expTemp);
							break;
						//过滤运算
						case 'filter':
							struct = this.expFilter(atom, expTemp);
							break;
						//逗号
						case 'comma':
							//检查是否对象表达式模式
							if (this.expMode === 'Object') {
								//获取当前参数 并进行对象拼接
								if (struct = args[args.length - 1]) {
									struct.value = this.expStruct;
									expTemp.valueType = null;
									this.expStruct = null;
								}
								break;
							}
							
							args.push(this.expStruct);
							this.nextExpressionLex();
							
							//检查当前语法是否结束
							if (args[args.length - 1] !== this.expStruct) {
								args.push(this.expStruct);
							} else {
								//块级表达式结束
							}
							break;
						//分号
						case 'semicolon':
							break;
						//冒号
						case 'colon':
							//检查是否对象表达式模式
							if (this.expMode === 'Object') {
								//检查是否以括号为key
								if (expTemp.brackets) {
									if (expTemp.brackets !== 2) {
										return this.throwErr('语法错误，对象表达式key有误!')
									}
									if (this.expStruct.args.length === 1) {
										//记录当前匹配的对象属性
										args.push({
											computed: true,
											key: this.expStruct.args[0]
										});
									} else {
										return this.throwErr('语法错误，对象表达式key有误!');
									}
									
								} else {
									//记录当前匹配的对象属性
									args.push({
										computed: false,
										key: this.expStruct
									});
								}
								this.nextExpressionLex();
								return;
							}
						//用于判断是否执行表达式
						case "bracketsLeft":
						//右括号
						case "bracketsRight":
							//检查是否能匹配语法块结束符号
							if (this.expBlockEnd.length && this.expBlockEnd.pop() === atom.value) {
								this.args = this.levelArgs.pop();
								break;
							}
						default:
							this.throwErr('语法错误,多出符号"' + atom.value + '"');
							break;
					}
					break;
				default:
					this.throwErr('语法表达式错误 ')
			}
			break;
		default:
			
			//元素类型
			switch (atom.type) {
				case atomType.Punctuator:
					switch (atom.identity) {
						//一元运算符
						case "unitary":
						case "single":
							struct = this.expUnary(atom, expTemp);
							nextAtom = this.getSoonAtom();
							break;
						//分号
						case "semicolon":
							break;
						//自运算
						case "update":
							struct = this.expUpdate(atom, expTemp);
							nextAtom = this.getSoonAtom();
							break;
						//左括号 块级表达式
						case "bracketsLeft":
							
							switch (atom.value) {
								//小括号
								case '(':
									//记录表达式模式
									let expMode = this.expMode;
									
									this.expMode = 'brackets';
									this.addBlockEnd(')');
									this.expressionLex();
									
									this.expMode = expMode;
									
									//恢复当前参数
									this.args = this.levelArgs[this.levelArgs.length - 1];
									
									//检查后续语法是否运算表达式
									if (this.expStruct.exp) {
										this.expStruct.priority = 1;
									}
									brackets = 1;
									struct = this.expStruct;
									
									nextAtom = this.atomLex();
									if (nextAtom) {
										//检查是否方法
										if (nextAtom.value === '(') {
											struct = this.expCall(nextAtom, expTemp);
											nextAtom = this.getSoonAtom();
											break;
										}
									}
								
								//中括号
								case '[':
									if (!struct) {
										brackets = 2;
										struct = this.expArray(atom, expTemp);
									}
								//大括号
								case '{':
									if (!struct) {
										brackets = 3;
										struct = this.expObject(atom, expTemp);
									}
									
									nextAtom = nextAtom || this.atomLex();
									//检查是否后续是点或中括号来判断成员表达式
									if (nextAtom && (nextAtom.value === '[' || nextAtom.value === '.')) {
										this.expressionLex(nextAtom, false);
										nextAtom = this.getSoonAtom();
									}
									break;
							}
							break;
						//右括号
						case "bracketsRight":
							//检查是否能匹配语法块结束符号
							if (this.expBlockEnd.length && this.expBlockEnd.pop() === atom.value) {
								this.args = this.levelArgs.pop();
								brackets = atom.value;
								break;
							}
						default:
							this.throwErr('语法表达式错误,未知表达式')
					}
					break;
				//字面量
				case atomType.Null:
				case atomType.String:
				case atomType.Numeric:
				case atomType.Boolean:
					struct = this.expStruct = atom;
					expTemp.valueType = atom.type;
					break;
				//标识量
				case atomType.Keyword:
				case atomType.identifier:
					struct = this.expStruct = atom;
					expTemp.valueType = 'identifier';
					
					nextAtom = this.atomLex();
					
					if (nextAtom) {
						switch (nextAtom.value) {
							case '[':
							case '.':
								this.expressionLex(nextAtom, false);
								nextAtom = this.getSoonAtom();
								break;
							//检查是否方法
							case '(':
								struct = this.expCall(nextAtom, expTemp);
								nextAtom = this.getSoonAtom();
						}
					}
					break;
				default:
					this.throwErr('未知表达式!')
			}
	}
	
	//检查当前的表达式是否属于括号表达式
	if (brackets) {
		expTemp.brackets = brackets;
	} else {
		delete expTemp.brackets;
	}
	
	if (isAdopt && struct) {
		struct = this.expressionLex(nextAtom);
	} else {
		this.soonAtom = nextAtom;
	}
	return struct;
};

//原子扫描
syntaxParserClass.prototype.atomLex = function () {
	if (this.eof()) return
	
	//语法原子
	let atom,
		//获取扫描位置的 Unicode 编码
		cp = this.source.charCodeAt(this.index);
	
	//检查是否标识符起始字符
	if (strGate.isidentifierStart(cp)) {
		atom = this.identifierLex();
		//检查是否小括号与分号
	} else if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
		//符号扫描
		atom = this.PunctuatorLex();
		// 字符串文字开始与单引号（U + 0027）或双引号（U + 0022）
	} else if (cp === 0x27 || cp === 0x22) {
		//字符串扫描
		atom = this.StringLiteralLex();
		//字符点可以作为浮点数，因此需要检查下一个字符
	} else if (cp === 0x2E) {
		//检查下一个字符是否数字
		if (strGate.isDecimalDigit(this.source.charCodeAt(this.index + 1))) {
			//数字扫描
			atom = this.NumericLiteralLex();
		} else {
			//符号扫描
			atom = this.PunctuatorLex();
		}
		//检查是否数字字符
	} else if (strGate.isDecimalDigit(cp)) {
		//数字扫描
		atom = this.NumericLiteralLex();
		//标识符起始字符范围 检查是否标识符起始字符
	} else if (cp >= 0xD800 && cp < 0xDFFF && strGate.isidentifierStart(strGate.codePointAt(cp))) {
		//标识符扫描
		atom = this.identifierLex();
		//检查是否空字符
	} else if (strGate.isWhiteSpace(cp)) {
		this.index++;
		return this.atomLex();
	} else {
		//符号扫描
		atom = this.PunctuatorLex();
	}
	
	//之前的元素
	this.preAtom = this.nowAtom;
	
	//当前元素
	this.nowAtom = atom;
	
	if (!atom) return;
	
	this.atoms.push(atom);
	return atom;
};

//原子类型扫描
atomScan(syntaxParserClass.prototype);


//检查扫描是否结束
syntaxParserClass.prototype.eof = function () {
	return this.index >= this.length;
};

//错误抛出
syntaxParserClass.prototype.throwErr = function (msg, atom) {
	this.errMsg = msg;
	atom = atom || this.preAtom || this.nowAtom;
	log.warn(msg + ' [ 第' + (atom.start + 1) + '个字符 ]',this.source);
}

//语法缓存
const syntaxCache = {};

export default function syntaxParser(code) {
	//获取缓存
	let syntaxStruct = syntaxCache[code];
	if (!syntaxStruct) {
		//无缓存则解析，并放入缓存
		syntaxStruct = new syntaxParserClass(code);
		syntaxCache[code] = syntaxStruct.expStruct;
		
		//销毁对象
		Object.keys(syntaxStruct).forEach(function (key) {
			// delete syntaxStruct[key];
		})
		syntaxStruct = syntaxCache[code];
	}
	return syntaxStruct;
}