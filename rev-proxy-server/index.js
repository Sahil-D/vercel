const express = require('express');
const httpProxy = require('http-proxy');
require('dotenv').config();

const app = express();
const proxy = httpProxy.createProxy();

const PORT = process.env.PORT;
const PROXY_BASE_PATH = process.env.PROXY_BASE_PATH;
const OUTPUT_FOLDER = process.env.OUTPUT_FOLDER;

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split('.')[0];

  console.log('resolving subDomain : ', subdomain);
  const resolvesTo = `${PROXY_BASE_PATH}/${OUTPUT_FOLDER}/${subdomain}`;

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on('proxyReq', (proxyReq, req, res) => {
  const url = req.url;
  if (url === '/') proxyReq.path += 'index.html';
});

app.listen(PORT, () =>
  console.log(`Reverse Proxy Server Running on PORT : ${PORT}`)
);
