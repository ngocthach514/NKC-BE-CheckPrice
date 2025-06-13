const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
require("dotenv").config();

puppeteer.use(StealthPlugin());

class AkiaAkiaHandler extends BaseHandler {
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
      console.log(`🔎 Tìm kiếm sản phẩm: ${searchUrl}`);

      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
        page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 }),
      ]);

      const found = await page.$("li.product a.woocommerce-LoopProduct-link");
      if (!found) {
        console.log(`❌ Không tìm thấy selector sản phẩm`);
        return { status: "NOT_FOUND" };
      }

      const productLink = await page.evaluate(() => {
        return document.querySelector("li.product a.woocommerce-LoopProduct-link")?.href || null;
      });

      if (!productLink) {
        console.log(`❌ Không có link sản phẩm`);
        return { status: "NOT_FOUND" };
      }

      console.log(`→ Found product: ${productLink}`);

      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }),
        page.goto(productLink, { waitUntil: "domcontentloaded", timeout: 30000 }),
      ]);

      const data = await page.evaluate(() => {
        const name =
          document.querySelector(".product_title")?.innerText ||
          document.querySelector("h1.product-title")?.innerText || "";

        const priceEl =
          document.querySelector(".price1 .numb.new") ||
          document.querySelector(".price1 .numb.cc4161c") ||
          document.querySelector(".price1 .numb.old");

        const price = priceEl?.innerText || "";

        return {
          name: name.trim(),
          price: price.trim(),
          link: window.location.href,
        };
      });

      if (!data.name || !data.price) return { status: "NOT_FOUND" };
      data.price = normalizePrice(data.price);

      return {
        ...data,
        status: "FOUND"
      };

    } catch (err) {
      console.error("❌ Lỗi xử lý AKIA:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site AKIA\n" + "=".repeat(100));
    }
  }
}

module.exports = AkiaAkiaHandler;
