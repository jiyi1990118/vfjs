const postcss = require("postcss");

module.exports = postcss.plugin('trim', () => (css) => {
    css.walk(({ type, raws }) => {
        if (type === 'rule' || type === 'atrule') {
            raws.before = raws.after = '\n';
        }
    });
});
