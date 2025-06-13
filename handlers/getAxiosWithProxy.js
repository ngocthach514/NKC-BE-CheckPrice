require("dotenv").config();
const { HttpsProxyAgent } = require("https-proxy-agent");

module.exports = function getAxiosWithProxy() {
  const axios = require("axios");

  const {
    PROXY_HOST,
    PROXY_PORT,
    PROXY_USERNAME,
    PROXY_PASSWORD,
  } = process.env;

  if (!PROXY_HOST || !PROXY_PORT) return axios;

  const proxyUrl = PROXY_USERNAME && PROXY_PASSWORD
    ? `http://${encodeURIComponent(PROXY_USERNAME)}:${encodeURIComponent(PROXY_PASSWORD)}@${PROXY_HOST}:${PROXY_PORT}`
    : `http://${PROXY_HOST}:${PROXY_PORT}`;

  const agent = new HttpsProxyAgent(proxyUrl);

  return axios.create({
    httpsAgent: agent,
    proxy: false,
  });
};
