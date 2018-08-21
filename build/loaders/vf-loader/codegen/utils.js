const qs = require('querystring')

// these are built-in query parameters so should be ignored
// if the user happen to add them as attrs
const ignoreList = [
  'id',
  'index',
  'src',
  'type'
]

// transform the attrs on a SFC block descriptor into a resourceQuery string
exports.attrsToQuery = (attrs, langFallback) => {
  let query = ``
  for (const name in attrs) {
    const value = attrs[name].value;
    if (!ignoreList.includes(name)) {
      query += `&${qs.escape(name)}=${value ? qs.escape(value) : `true`}`
    }
  }
  if (langFallback && !(`lang` in attrs)) {
    query += `&lang=${ attrs.type?qs.escape(attrs.type.value):langFallback}`
  }
  return query
}

