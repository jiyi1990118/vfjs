const hotReloadAPIPath = JSON.stringify(require.resolve('./vf-hot-reload-api'))

const genTemplateHotReloadCode = (id, request) => {
  return `
    module.hot.accept(${request}, function () {
      api.rerender('${id}', {
        render: render,
        staticRenderFns: staticRenderFns
      })
    })
  `.trim()
}

exports.genHotReloadCode = (id, functional, templateRequestList) => {
  return `
  /* hot reload */
  if (module.hot) {
    var api = require(${hotReloadAPIPath})
    api.install(require('vf'))
    if (api.compatible) {
      module.hot.accept()
      if (!module.hot.data) {
        api.createRecord('${id}', component.options)
      } else {
        api.${functional ? 'rerender' : 'reload'}('${id}', component.options)
      }
      ${templateRequestList ? genTemplateHotReloadCode(id, templateRequestList) : ''}
    }
  }
  `.trim()
}
