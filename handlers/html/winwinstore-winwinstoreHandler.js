const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
const { waitForSelectorRetry } = require("../../utils/wait");
require("dotenv").config();

puppeteer.use(StealthPlugin());

class WinwinstoreWinwinstoreHandler extends BaseHandler {
  async search(keyword) {
    const { PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD } = process.env;
    const proxyArgs = [];

    if (PROXY_HOST && PROXY_PORT) {
      proxyArgs.push(`--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", ...proxyArgs],
    });

    const page = await browser.newPage();

    if (PROXY_USERNAME && PROXY_PASSWORD) {
      await page.authenticate({
        username: PROXY_USERNAME,
        password: PROXY_PASSWORD,
      });
    }

    try {
      const searchUrl = `https://www.winwinstore.vn/?s=${encodeURIComponent(keyword)}&post_type=product`;
      console.log(`🔍 Winwinstore search: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      const ok = await waitForSelectorRetry(page, ".td_woo_product_module");
      if (!ok) {
        console.log("❌ Không tìm thấy danh sách sản phẩm");
        return { status: "NOT_FOUND" };
      }

      const data = await page.evaluate((keyword) => {
        function toPlain(str) {
          return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        }

        const keywordNorm = toPlain(keyword);
        const words = keywordNorm.split(" ").filter(w => w.length > 2);

        const items = Array.from(document.querySelectorAll(".td_woo_product_module"));
        for (let el of items) {
          const aTag = el.querySelector("h3.td-module-title a");
          const priceEl = el.querySelector(".price bdi");

          if (!aTag || !priceEl) continue;

          const title = aTag.innerText.trim();
          const link = aTag.href;
          const priceText = priceEl.innerText.trim();

          const titleNorm = toPlain(title);
          const matched = words.every(w => titleNorm.includes(w));

          if (matched) {
            return {
              name: title,
              priceText,
              link
            };
          }
        }

        return null;
      }, keyword);

      if (!data || !data.name || !data.priceText) {
        console.log("⚠️ Không tìm thấy sản phẩm khớp");
        return { status: "NOT_FOUND" };
      }

      return {
        name: data.name,
        price: normalizePrice(data.priceText),
        link: data.link,
        status: "FOUND"
      };

    } catch (err) {
      console.error("❌ Handler Winwinstore lỗi:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site Winwinstore\n" + "=".repeat(100));
    }
  }
}

module.exports = WinwinstoreWinwinstoreHandler;
