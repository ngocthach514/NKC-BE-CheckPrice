require("dotenv").config();
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

module.exports = async function getBrowserWithProxy() {
  const {
    PROXY_HOST,
    PROXY_PORT,
    PROXY_USERNAME,
    PROXY_PASSWORD
  } = process.env;

  let args = ['--no-sandbox', '--disable-setuid-sandbox'];
  if (PROXY_HOST && PROXY_PORT) {
    const proxy =
      PROXY_USERNAME && PROXY_PASSWORD
        ? `http://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`
        : `http://${PROXY_HOST}:${PROXY_PORT}`;

    args.push(`--proxy-server=${PROXY_HOST}:${PROXY_PORT}`);

    process.env.PUPPETEER_PROXY_AUTH = PROXY_USERNAME && PROXY_PASSWORD
      ? `${PROXY_USERNAME}:${PROXY_PASSWORD}`
      : null;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args
  });

  return browser;
};
