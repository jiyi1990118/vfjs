/**
 * Created by xiyuan on 17-3-7.
 */
"use strict";

function getType(value) {
	var type = typeof (value);
	if (type == 'object') {
		type = {}.toString.call(value).toLocaleLowerCase().match(/object\s+(html\w+?(element)|(\w+))/);
		type = type[2] || type[1]
	}
	return type;
};

//把对象转换成json字符串
function stringify(obj) {
	var type = getType(obj);
	switch (type) {
		case 'null':
			return JSON.stringify(obj);
			break;
		case 'function':
			return obj.toString();
			break;
		case 'array':
			return '[' + obj.map(stringify).join(',') + ']';
			break;
		default:
			if (typeof obj === "object") {
				return '{' + Object.keys(obj).map(function (key) {
					return '"' + key + '":' + stringify(obj[key]);
				}).join(',') + '}';
			} else {
				return JSON.stringify(obj);
			}
	}
};

//把字符串解析成对象
function parse(str) {
	let json = str;
	if (typeof (str) === 'object') {
		return str;
	} else {
		try {
			json = new Function("return " + str)();
		}
		catch (e) {
			return str;
		}
		return json;
	}
}

module.export = {
	parse,
	stringify,
};
