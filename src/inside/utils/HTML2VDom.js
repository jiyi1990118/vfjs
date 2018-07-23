// HTML解析包
import HTMLParser from './HTMLParser';

// 字符串处理包
import string from '../lib/string';

// 虚拟Dom包
import vdom from './vdom';

/**
 * html字符串转虚拟dom
 * @param htmlStr
 * @returns {Array}
 */
function str2vdom(htmlStr) {
	var nowStruct,
		eleStruct = [],
		structLevel = [];
	
	HTMLParser(string.HTMLDecode(htmlStr), {
		//标签节点起始
		start: function (tagName, attrs, unary) {
			nowStruct = vdom.vnode(
				tagName,
				{
					attrsMap: attrs.reduce(function (attrs, current) {
						var type,
							localtion,
							modifiers,
							attrName = current.name;
						
						//获取自定义属性的类型
						if ((localtion = attrName.indexOf(':')) !== -1) {
							type = attrName.slice(localtion + 1);
							attrName = attrName.slice(0, localtion) || 'bind';
							//获取修饰符
							if ((localtion = type.indexOf('.')) !== -1) {
								modifiers = type.slice(localtion + 1);
								type = type.slice(0, localtion);
								modifiers = modifiers.split('.')
							}
						} else {
							//获取修饰符
							if ((localtion = attrName.indexOf('.')) !== -1) {
								modifiers = attrName.slice(localtion + 1);
								attrName = attrName.slice(0, localtion);
								modifiers = modifiers.split('.')
							}
						}
						
						if (attrs[attrName] && type) {
							attrs[attrName] = [{
								type: type,
								modifiers: modifiers,
								value: current.value,
								attrName: current.name
							}].concat(attrs[attrName]);
						} else {
							attrs[attrName] = {
								type: type,
								modifiers: modifiers,
								value: current.value,
								attrName: current.name
							};
						}
						return attrs;
					}, {})
				},
				[]
			)
			
			structLevel.push(nowStruct)
			if (unary) {
				this.end();
			}
		},
		//标签节点结束
		end: function () {
			//前一个元素结构
			var parentStruct = structLevel.pop();
			
			//检查当前是否顶级层级
			if (structLevel.length) {
				//检查当前元素是否子元素
				if (parentStruct === nowStruct) {
					parentStruct = structLevel[structLevel.length - 1];
				}
				parentStruct.children.push(nowStruct);
				nowStruct = parentStruct;
			} else {
				if (parentStruct !== nowStruct) {
					parentStruct.children.push(nowStruct)
				}
				eleStruct.push(parentStruct)
			}
		},
		//文本节点
		chars: function (text) {
			//空字符直接忽略
			if (/^\s+$/.test(text)) return
			
			//获取界定符位置
			//界定符
			var DelimiterLeft = "{{",
				DelimiterRight = "}}";
			
			var exps = [],
				strs = [],
				expStr;
			
			/**
			 * 获取表达式
			 * @param text
			 * @returns {*}
			 */
			(function findExp(text) {
				var sid,
					eid,
					_str,
					str = text;
				
				if (str.length) {
					if ((sid = str.indexOf(DelimiterLeft)) === -1 || (eid = str.indexOf(DelimiterRight, sid)) === -1) {
						exps.push(str);
						strs.push(str);
					} else {
						if (sid) {
							_str = str.slice(0, sid);
							exps.push(_str);
							strs.push(_str);
						}
						//截取界定符中的表达式字符
						expStr = str.slice(sid + DelimiterLeft.length).slice(0, eid - sid - DelimiterLeft.length);
						//解析表达式
						exps.push(syntaxStruct(expStr));
						//剩下的字符
						findExp(str.slice(eid + DelimiterRight.length));
					}
				}
				return text;
			})(text)
			
			var nowStruct = vdom.vnode(
				undefined,
				{
					exps: exps,
					textExpString: expStr
				},
				undefined,
				strs.join('')
			)
			
			//检查当前是否顶级层级
			if (structLevel.length) {
				structLevel[structLevel.length - 1].children.push(nowStruct)
			} else {
				eleStruct.push(nowStruct)
			}
		}
	})
	structLevel = undefined;
	return eleStruct.length === 1 ? eleStruct[0] : eleStruct;
}

/**
 * html 转换成虚拟dom数据结构
 */
export default function (html) {
	//检查是否dom节点
	return html.nodeName ? vdom.node2vnode(html) : str2vdom(html);
};