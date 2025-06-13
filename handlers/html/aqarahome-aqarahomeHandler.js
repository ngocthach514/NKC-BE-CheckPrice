const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
require("dotenv").config();

puppeteer.use(StealthPlugin());

class AqarahomeAqarahomeHandler extends BaseHandler {
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
      const searchUrl = `${this.site.url}?s=${encodeURIComponent(keyword)}&post_type=product`;
      console.log(`🔍 Aqarahome search: ${searchUrl}`);

      // Chờ chuyển hướng hoàn tất sau khi vào search page
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
        page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 }),
      ]);

      const productLink = await page.evaluate(() => {
        const firstProduct = document.querySelector("li.product a.woocommerce-LoopProduct-link");
        return firstProduct?.href || null;
      });

      if (!productLink) {
        console.log(`❌ Không tìm thấy selector sản phẩm trên trang tìm kiếm`);
        return { status: "NOT_FOUND" };
      }

      console.log(`→ Mở trang chi tiết: ${productLink}`);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
        page.goto(productLink, { waitUntil: "domcontentloaded", timeout: 30000 }),
      ]);

      const data = await page.evaluate(() => {
        const name = document.querySelector(".zek_page_title")?.innerText || "";
        const priceEls = Array.from(document.querySelectorAll(".woocommerce-variation-price .amount"));

        const prices = priceEls.map(el => el?.innerText?.trim()).filter(Boolean);
        const link = window.location.href;

        return {
          name,
          prices,
          link,
        };
      });

      if (!data.name || !data.prices.length) {
        return { status: "NOT_FOUND" };
      }

      const minPrice = data.prices.map(p => normalizePrice(p)).filter(p => p !== "0.0");
      const price = minPrice.length ? Math.min(...minPrice.map(Number)).toFixed(1) : "0.0";

      return {
        name: data.name,
        price,
        link: data.link,
        status: "FOUND",
      };

    } catch (err) {
      console.error("❌ Handler aqarahome-aqarahome lỗi:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site Aqarahome\n" + "=".repeat(100));
    }
  }
}

module.exports = AqarahomeAqarahomeHandler;
