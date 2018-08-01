//字符检测
export default {
	// 空白字符
	isWhiteSpace: function (cp) {
		return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) || (cp === 0x0D) || (cp === 0x0A) ||
		(cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
	},
	// 行结束字符
	isLineTerminator: function (cp) {
		return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
	},
	// 变量起始字符
	isidentifierStart: function (cp) {
		return (cp === 0x24) || (cp === 0x5F) ||
			(cp >= 0x41 && cp <= 0x5A) ||
			(cp >= 0x61 && cp <= 0x7A) ||
			(cp === 0x5C) ||
			(cp >= 0x80);
	},
	// 变量字符
	isidentifierPart: function (cp) {
		return (cp === 0x24) || (cp === 0x5F) ||
			(cp >= 0x41 && cp <= 0x5A) ||
			(cp >= 0x61 && cp <= 0x7A) ||
			(cp >= 0x30 && cp <= 0x39) ||
			(cp === 0x5C) ||
			(cp >= 0x80);
	},
	// 数字字符
	isDecimalDigit: function (cp) {
		return (cp >= 0x30 && cp <= 0x39); // 0..9
	},
	//检查是否关键词
	isKeyword: function (id) {
		switch (id.length) {
			case 2:
				return (id === 'if') || (id === 'in') || (id === 'do');
			case 3:
				return (id === 'var') || (id === 'for') || (id === 'new') ||
					(id === 'try') || (id === 'let');
			case 4:
				return (id === 'this') || (id === 'else') || (id === 'case') ||
					(id === 'void') || (id === 'with') || (id === 'enum');
			case 5:
				return (id === 'while') || (id === 'break') || (id === 'catch') ||
					(id === 'throw') || (id === 'const') || (id === 'yield') ||
					(id === 'class') || (id === 'super');
			case 6:
				return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
					(id === 'switch') || (id === 'export') || (id === 'import');
			case 7:
				return (id === 'default') || (id === 'finally') || (id === 'extends');
			case 8:
				return (id === 'function') || (id === 'continue') || (id === 'debugger');
			case 10:
				return (id === 'instanceof');
			default:
				return false;
		}
	},
	//检查是否标识符中一部分
	codePointAt: function (cp) {
		if (cp >= 0xD800 && cp <= 0xDBFF) {
			var second = this.source.charCodeAt(i + 1);
			if (second >= 0xDC00 && second <= 0xDFFF) {
				cp = (cp - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
			}
		}
		return cp;
	}
};