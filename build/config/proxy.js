// 代理各种网关资源链接
const proxyModeUrl = {
  "tesb": 'http://api.tesb.lovego.xin',
  "tesm": 'http://api.tesm.lovego.xin',
  "lovego": 'http://mobile.lovego.com',
};

// 代理配置
const proxyConf = {
  // 会员中心
  '/user/': {
    '^/user/': 'lovego/user/'
  },
  // 商品中心
  '/product/': 'lovego/product/',
  // 商品搜索
  '/search': 'lovego/search',
  // 订单
  '/order/': '/lovego/order/',
  //营销中心
  '/marketing': '/lovego/marketing',
  // 微信jsSDK调试
  '/wechat': '/wechat',
  // 微信支付调试
  //'/orders/': '/orders/',
  // 微信免登陆测试
  //'/users/getUserInfoByCode': '/users/getUserInfoByCode',
};

// 本地个性化配置
const localModeUrl = {
  '/users/': {
    target: 'http://192.168.2.61:9002',
    pathRewrite: {
      '^/users/': '/users/',
    }
  },
  '/front/': {
    target: 'http://192.168.2.46:9002',
    pathRewrite: {
      '^/front/': '/front/',
    }
  },
  '/orders': {
    target: 'http://192.168.2.62:9001',
    pathRewrite: {
      '^/orders': '/orders',
    }
  },
  '/rock': {
    target: 'http://192.168.2.62:9001',
    pathRewrite: {
      '^/rock': '/rock',
    }
  },
  '/product': {
    target: 'http://192.168.2.48:9000',
    pathRewrite: {
      '^/product': '/product',
    }
  }
};
/******************************************************* 下面代码禁止修改 ******************************************************************************/

const DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;

/**
 * 规范化路径
 * @param path
 * @returns {*}
 */
function normalize(path) {
  path = path.replace(/\\/g, '/').replace(/\/\.\//g, '/');
  path = path.replace(/([^:/])\/+\//g, '$1/');
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, '/');
  }
  return path;
}

// 根据不同网关配置生成最终的代理配置
module.exports = Object.keys(proxyModeUrl).reduce((map, gateway) => {
  
  Object.keys(proxyConf).forEach(key => {
    let pathRewrite = proxyConf[key];
    let urlKey = normalize('/' + gateway + '/' + key);
    
    // 代理配置生成
    map[urlKey] = {
      changeOrigin: true,  //是否跨域
      target: proxyModeUrl[gateway],
      pathRewrite: typeof pathRewrite === 'object' ? Object.keys(pathRewrite).reduce((pathMap, path) => {
        pathMap[normalize(path.match(/^\^\//) ? '^/' + gateway + '/' + path.replace(/^\^\//, '') : '/' + gateway + path)] = pathRewrite[path];
        return pathMap;
      }, {}) : {[normalize('^/' + urlKey)]: pathRewrite}
    };
  });
  
  // 支持本地自定义配置
  Object.keys(localModeUrl).forEach((key) => {
    let info = localModeUrl[key];
    map[key] = {
      changeOrigin: true,  //是否跨域
      target: info.target,
      pathRewrite: info.pathRewrite,
    }
  });
  
  return map;
}, {});
