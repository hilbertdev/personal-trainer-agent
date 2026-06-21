const { getDefaultConfig } = require('expo/metro-config');
const { createProxyMiddleware } = require('http-proxy-middleware');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const apiProxyTarget = process.env.EXPO_PUBLIC_API_PROXY_TARGET ?? 'http://localhost:5075';
const apiProxy = createProxyMiddleware({
  target: apiProxyTarget,
  changeOrigin: true,
});

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    if (req.url?.startsWith('/api')) {
      return apiProxy(req, res, next);
    }

    return middleware(req, res, next);
  },
};

module.exports = config;
