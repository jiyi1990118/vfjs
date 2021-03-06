/**
 * 实例对比
 * @param L 表示左表达式
 * @param R 表示右表达式
 * @returns {boolean}
 */
function isInstance(L, R) {//L 表示左表达式，R 表示右表达式
	var O = R.prototype;// 取 R 的显示原型
	L = L.__proto__;// 取 L 的隐式原型
	while (true) {
		if (L === null)
			return false;
		if (O === L)// 这里重点：当 O 严格等于 L 时，返回 true
			return true;
		L = L.__proto__;
	}
}

function getType(value) {
	return {}.toString.call(value).slice(8,-1).toLocaleLowerCase().replace(/html(body)?/,'');
};

function isType(type) {
	return function (obj) {
		return {}.toString.call(obj) == "[object " + type + "]"
	}
};

/*判断一个变量是否定义*/
function isDefined(value) {
	return typeof value !== 'undefined';
}

function isElement(node) {
	return !!(node && (node.nodeName || (node.prop && node.attr && node.find)));
}

/*判断对象是空值*/
function isEmpty(obj) {
	switch (typeof obj) {
		case 'object':
			for (var n in obj) {
				return false
			}
			return true;
			break;
		default :
			if (!obj) {
				return true
			}
			return false
	}
};

var TYPED_ARRAY_REGEXP = /^\[object (?:Uint8|Uint8Clamped|Uint16|Uint32|Int8|Int16|Int32|Float32|Float64)Array\]$/;

//是否其他类型数组
function isTypedArray(value) {
	return value && isNumber(value.length) && TYPED_ARRAY_REGEXP.test(toString.call(value));
}

//对比两个数据
function equals(o1, o2) {
	if (o1 === o2) return true;
	if (o1 === null || o2 === null) return false;
	if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
	var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
	if (t1 === t2) {
		if (t1 === 'object') {
			if (isArray(o1)) {
				if (!isArray(o2)) return false;
				if ((length = o1.length) == o2.length) {
					for (key = 0; key < length; key++) {
						if (!equals(o1[key], o2[key])) return false;
					}
					return true;
				}
			} else if (isDate(o1)) {
				if (!isDate(o2)) return false;
				return equals(o1.getTime(), o2.getTime());
			} else if (isRegExp(o1)) {
				return isRegExp(o2) ? o1.toString() === o2.toString() : false;
			} else {
				if (isWindow(o1) || isWindow(o2) ||
					isArray(o2) || isDate(o2) || isRegExp(o2)) return false;
				keySet = Object.create(null);
				for (key in o1) {
					if (key.charAt(0) === '$' || isFunction(o1[key])) continue;
					if (!equals(o1[key], o2[key])) return false;
					keySet[key] = true;
				}
				for (key in o2) {
					if (!(key in keySet) &&
						key.charAt(0) !== '$' &&
						isDefined(o2[key]) &&
						!isFunction(o2[key])) return false;
				}
				return true;
			}
		}
	}
	
	/*检查两个变量是否是function*/
	if (getType(o1) === getType(o2)) {
		switch (getType(o1)) {
			case 'function':
				if (o1.toString() !== o2.toString()) {
					return false;
				}
				var keys = {}, key;
				for (key in o1) {
					keys[key] = key;
				}
				for (key in o2) {
					keys[key] = key;
				}
				for (key in keys) {
					if (o1.propertyIsEnumerable(key) && o2.propertyIsEnumerable(key)) {
					
					} else {
						return false;
					}
				}
				
				keys = {};
				for (key in o1.prototype) {
					keys[key] = key;
				}
				for (key in o2.prototype) {
					keys[key] = key;
				}
				for (key in keys) {
					if (o1.prototype.propertyIsEnumerable(key) && o2.prototype.propertyIsEnumerable(key)) {
					
					} else {
						return false;
					}
				}
				return true;
				
				break;
		}
	}
	return false;
};

module.exports = {
	isType: isType,
	isObject: function (data) {
		return data instanceof Object;
	},
	isArray: function (data) {
		return data instanceof Array;
	},
	isString: function (data) {
		return typeof data === 'string';
	},
	isNumber: function (data) {
		return typeof data === 'number';
	},
	isFunction: function (data) {
		return data instanceof Function;
	},
	isDate: function (data) {
		return data instanceof Date;
	},
	isBoolean: function (data) {
		return typeof data === 'boolean';
	},
	isRegExp: function (data) {
		return data instanceof RegExp;
	},
	isFile: function (data) {
		return data instanceof File;
	},
	isFormData: function (data) {
		return data instanceof FormData;
	},
	isBlob: function (data) {
		return data instanceof Blob;
	},
	isWindow: function (data) {
		return data instanceof Window;
	},
	isHTMLDocument: function (data) {
		return data instanceof HTMLDocument;
	},
	isPromise: function (data) {
		return isInstance(data, Promise)
	},
	isDefined: isDefined,
	isElement: isElement,
	isEmpty: isEmpty,
	isTypedArray: isTypedArray,
	equals: equals,
	getType: getType,
	isInstance: isInstance,
}