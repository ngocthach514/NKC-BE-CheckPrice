const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
const { waitForSelectorRetry } = require("../../utils/wait");
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

      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      const productLink = await page.evaluate((keyword) => {
        function toPlainText(str) {
          return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
        }

        const normKeyword = toPlainText(keyword);
        const words = normKeyword.split(" ").filter(w => w.length > 2);

        return Array.from(document.querySelectorAll("[data-yotpo-url]"))
          .map(el => el.getAttribute("data-yotpo-url"))
          .find(url => {
            const normUrl = toPlainText(url);
            return words.every(word => normUrl.includes(word));
          });
      }, keyword);

      if (!productLink) {
        console.log("❌ Không tìm thấy link sản phẩm từ data-yotpo-url");
        return { status: "NOT_FOUND" };
      }

      console.log(`→ Tìm thấy link sản phẩm: ${productLink}`);
      await page.goto(productLink, { waitUntil: "networkidle2", timeout: 30000 });

      const ok = await waitForSelectorRetry(page, ".product_title, h1.product-title");
      if (!ok) {
        console.log("❌ Không tìm thấy tiêu đề sản phẩm sau nhiều lần thử");
        return { status: "NOT_FOUND" };
      }

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
