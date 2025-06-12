require("dotenv").config();
const { HttpsProxyAgent } = require("https-proxy-agent");

module.exports = function getAxiosWithProxy() {
  const axios = require("axios");

  if (!process.env.PROXY_HOST || !process.env.PROXY_PORT) return axios;

  const agent = new HttpsProxyAgent({
    host: process.env.PROXY_HOST,
    port: parseInt(process.env.PROXY_PORT),
    auth: process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD
      ? `${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}`
      : undefined,
  });

  return axios.create({
    httpsAgent: agent,
    proxy: false,
  });
};
