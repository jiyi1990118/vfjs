// 字符检查
const strGate = require('./strGate');
// 语法原子类型
const atomType = require('./atomType');

module.exports = function (scan) {
	
	// 标识符
	scan.identifierLex = function () {
		let type,
			nowStr,
			identity,
			priority,
			start = this.index++;
		
		// 循环读取字符
		while (!this.eof()) {
			nowStr = this.source.charCodeAt(this.index)
			// 检查是否变量字符
			if (strGate.isidentifierPart(nowStr)) {
				++this.index;
			} else {
				break
			}
		}
		
		// 最终得到的标示量字符
		const id = this.source.slice(start, this.index);
		
		//只有一个字符，因此它必定是标识符。
		if (id.length === 1) {
			type = atomType.identifier;
			//关键字
		} /*else if (strGate.isKeyword(id)) {
			type = atomType.Keyword;
			
		} */
		// 检查是否一元运算关键词
		else if (strGate.isWhiteSpace(nowStr) && ('delete' === id || 'new' === id || 'typeof' === id)) {
			// 伪标点
			type = atomType.Punctuator;
			// 优先级
			priority = 3;
			// 一元运算标识
			identity = 'unitary';
			
		} else if ('instanceof' === id && this.preAtom && strGate.isWhiteSpace(nowStr) && strGate.isWhiteSpace(this.source.charCodeAt(this.preAtom.end + 1))) {
			// 伪标点
			type = atomType.Punctuator;
			// 优先级小于 位运算
			priority = 7;
			// 二元运算标识
			identity = 'single';
		}
		// 是否空对象
		else if (id === 'null') {
			type = atomType.Null;
			// 布尔值
		} else if (id === 'true' || id === 'false') {
			type = atomType.Boolean;
			// 检查是否有解析声明
		} else if (!this.preAtom && (id === 'async' || id === 'await') && strGate.isWhiteSpace(nowStr)) {
			this.mode = id;
			return this.expressionLex();
			// 标识符
		} else {
			type = atomType.identifier;
		}
		
		return {
			type: type,
			value: id,
			start: start,
			end: this.index,
			// 运算标识
			identity: identity,
			// 优先级
			priority: priority
		};
	};
	
	/*
	 * dot 点号 1
	 * unitary 一元运算符 3
	 * single 加减运算 5
	 * complex 乘除 乘方 运算 4
	 * logical 逻辑运算 7
	 * bitwise 位运算 6
	 * ternary 三元运算 8
	 * comma 逗号 1
	 * semicolon 分号 1
	 * colon 冒号 8
	 * interrogation 问号 8
	 * bracketsLeft 左括号 2
	 * bracketsRight 右括号 2
	 * keySymbol 关键符号 8
	 * assignment 分配运算 8
	 * update 自运算  2
	 * filter 3 过滤运算
	 * */
	
	// 标点
	scan.PunctuatorLex = function () {
		let identity,
			priority,
			start = this.index;
		
		// 获取当前字符
		let str = this.source[this.index++];
		
		switch (str) {
			case '{':
			case '[':
			case '(':
				priority = 2;
				identity = 'bracketsLeft';
				break;
			case '}':
			case ']':
			case ')':
				priority = 2;
				identity = 'bracketsRight';
				break;
			case '.':
				priority = 1;
				identity = 'dot'
				if (this.source[this.index] === '.' && this.source[this.index + 1] === '.') {
					// ...符号
					this.index += 2;
					str = '...';
					priority = 9;
					identity = 'keySymbol'
				}
				break;
			case ';':
				priority = 1;
				identity = 'semicolon';
				break;
			case ',':
				priority = 1;
				identity = 'comma';
				break;
			case ':':
				priority = 8;
				identity = 'colon';
				break;
			case '?':
				priority = 8;
				identity = 'interrogation';
				break;
			case '~':
				priority = 3;
				identity = 'unitary';
				break;
			default:
				// 4个字符长度的符号
				str = this.source.substr(--this.index, 4);
				if (str === '>>>=') {
					this.index += 4;
					priority = 9;
					identity = 'assignment';
				} else {
					// 3个字符长度的符号
					str = str.substr(0, 3);
					this.index += 3;
					
					switch (str) {
						case '===':
						case '!==':
							priority = 7;
							identity = 'logical';
							break;
						case '>>>':
							priority = 6;
							identity = 'bitwise';
							break;
						case '<<=':
						case '>>=':
						case '**=':
							priority = 9;
							identity = 'assignment';
							break;
						default:
							// 2个字符长度的符号
							str = str.substr(0, 2);
							this.index--;
							
							switch (str) {
								case '||':
								case '&&':
								case '==':
								case '!=':
								case '<=':
								case '>=':
									priority = 7;
									identity = 'logical';
									break;
								case '++':
								case '--':
									priority = 2;
									identity = 'update';
									break;
								case '<<':
								case '>>':
									priority = 6;
									identity = 'bitwise';
									break;
								case '/=':
								case '+=':
								case '-=':
								case '*=':
								case '&=':
								case '|=':
								case '^=':
								case '%=':
									priority = 9;
									identity = 'assignment';
									break;
								case '**':
									priority = 4;
									identity = 'complex';
									break;
								case '=>':
									priority = 9;
									identity = 'keySymbol';
									break;
								//过滤运算符号
								case '|:':
									priority = 3;
									identity = 'filter';
									break;
								default:
									this.index -= 2;
									// 1个字符长度的符号
									str = this.source[this.index++];
									
									switch (str) {
										case '<':
										case '>':
											priority = 7;
											identity = 'logical';
											break;
										case '=':
											priority = 9;
											identity = 'assignment';
											break;
										case '+':
										case '-':
											priority = 5;
											identity = 'single';
											break;
										case '*':
										case '/':
										case '%':
											priority = 4;
											identity = 'complex';
											break;
										case '&':
										case '|':
										case '^':
											priority = 6;
											identity = 'bitwise';
											break;
										case '!':
											priority = 3;
											identity = 'unitary';
											break;
										default:
											this.index--
									}
							}
					}
				}
		}
		
		if (this.index === start) {
			return this.throwErr('标点错误');
		}
		return {
			type: atomType.Punctuator,
			value: str,
			start: start,
			end: this.index,
			identity: identity,
			priority: priority
		};
	}
	
	// 字符
	scan.StringLiteralLex = function () {
		const start = this.index;
		let quote = this.source[start];
		if (!(quote === '\'' || quote === '"')) {
			return this.throwErr('String literal must starts with a quote');
		}
		
		++this.index;
		let str = '';
		while (!this.eof()) {
			var ch = this.source[this.index++];
			// 检查是否起始字符串引号
			if (ch === quote) {
				quote = '';
				break;
				// 检查是否行结束字符
			} else if (strGate.isLineTerminator(ch.charCodeAt(0))) {
				break;
			} else {
				str += ch;
			}
		}
		
		if (quote !== '') {
			this.index = start;
			return this.throwErr('字符语法错误，没有找到关闭的引号！');
		}
		
		return {
			type: atomType.String,
			value: str,
			start: start,
			end: this.index
		};
	}
	
	// 数字
	scan.NumericLiteralLex = function () {
		const start = this.index;
		const ch = this.source[start];
		
		//检查是否数字或小数点开头
		if (!(strGate.isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'))) {
			return this.throwErr('数字文字必须以十进制数字或小数点开始')
		}
		
		let num = '';
		
		// 检查字符是否以小数点开头
		if (ch === '.') {
			num += this.source[this.index++];
			while (strGate.isDecimalDigit(this.source.charCodeAt(this.index))) {
				num += this.source[this.index++];
			}
		} else {
			num = this.source[this.index++];
			// 遍历获取后续字符并判断是否数字
			while (strGate.isDecimalDigit(this.source.charCodeAt(this.index))) {
				num += this.source[this.index++];
			}
		}
		
		// 检查数字后续字符是否标识符开始
		if (strGate.isidentifierStart(this.source.charCodeAt(this.index))) {
			this.throwErr('Number类型语法错误!');
		}
		return {
			type: atomType.Numeric,
			value: parseFloat(num),
			start: start,
			end: this.index
		};
	}
	
}