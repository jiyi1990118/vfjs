const qs = require('querystring')
const { compileStyle } = require('@vue/component-compiler-utils')

//这是一个处理scope css 转换的后加载程序。
//通过全局 pitcher 在CSS加载器前进行正确的注入。
//用于从 vf 文件中启动的任何 <style scoped> 选择请求。
module.exports = function (source, inMap) {
  const query = qs.parse(this.resourceQuery.slice(1))
  const { code, map, errors } = compileStyle({
    source,
    filename: this.resourcePath,
    id: `scope-${query.id}`,
    map: inMap,
    scoped: !!query.scoped,
    trim: true
  })

  if (errors.length) {
    this.callback(errors[0])
  } else {
    this.callback(null, code, map)
  }
}
