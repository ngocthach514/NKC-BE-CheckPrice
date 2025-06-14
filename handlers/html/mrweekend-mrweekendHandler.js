const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
const { waitForSelectorRetry } = require("../../utils/wait");
require("dotenv").config();

puppeteer.use(StealthPlugin());

class MrweekendMrweekendHandler extends BaseHandler {
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
      const searchUrl = `https://mrweekend.vn/search?q=${encodeURIComponent(keyword)}&type=product`;
      console.log(`🔍 MrWeekend search: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      const ok = await waitForSelectorRetry(page, ".grid-uniform .grid__item");
      if (!ok) {
        console.log("❌ Không tìm thấy vùng hiển thị sản phẩm");
        return { status: "NOT_FOUND" };
      }

      const data = await page.evaluate((keyword) => {
        function toPlain(str) {
          return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        }

        const keywordNorm = toPlain(keyword);
        let bestMatch = null;
        let matchScore = Infinity;

        const items = Array.from(document.querySelectorAll(".grid-uniform .grid__item"));
        for (let el of items) {
          const nameEl = el.querySelector(".product-name h2");
          const priceEl = el.querySelector(".current-price");
          const linkEl = el.querySelector(".a-product__image a");

          if (!nameEl || !priceEl || !linkEl) continue;

          const name = nameEl.innerText.trim();
          const priceText = priceEl.innerText.trim();
          const link = linkEl.href.startsWith("http")
            ? linkEl.href
            : "https://mrweekend.vn" + linkEl.getAttribute("href");

          const normName = toPlain(name);
          const index = normName.indexOf(keywordNorm);

          if (index !== -1 && index < matchScore) {
            matchScore = index;
            bestMatch = { name, priceText, link };
          }
        }

        return bestMatch;
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
      console.error("❌ Handler MrWeekend lỗi:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site MrWeekend\n" + "=".repeat(100));
    }
  }
}

module.exports = MrweekendMrweekendHandler;
