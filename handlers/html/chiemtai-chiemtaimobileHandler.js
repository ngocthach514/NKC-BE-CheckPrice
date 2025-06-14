const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
const { waitForSelectorRetry } = require("../../utils/wait");
require("dotenv").config();

puppeteer.use(StealthPlugin());

class ChiemtaiChiemtaimobileHandler extends BaseHandler {
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
      const searchUrl = `https://chiemtaimobile.vn/search/?subcats=Y&pcode_from_q=N&pshort=N&pfull=N&pname=Y&pkeywords=Y&search_performed=Y&q=${encodeURIComponent(keyword)}&dispatch=products.search`;
      console.log(`🔍 ChiemtaiMobile search: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // Tìm link sản phẩm đầu tiên phù hợp với từ khoá
      const productLink = await page.evaluate((keyword) => {
        function toPlainText(str) {
          return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        }

        const normKeyword = toPlainText(keyword);
        const words = normKeyword.split(" ").filter(w => w.length > 2);

        const items = Array.from(document.querySelectorAll(".ty-grid-list__item a.product-title"));
        const matched = items.find(a => {
          const normHref = toPlainText(a.href);
          return words.every(w => normHref.includes(w));
        });

        return matched?.href || null;
      }, keyword);

      if (!productLink) {
        console.log("❌ Không tìm thấy link sản phẩm");
        return { status: "NOT_FOUND" };
      }

      console.log(`→ Tìm thấy link sản phẩm: ${productLink}`);
      await page.goto(productLink, { waitUntil: "networkidle2", timeout: 30000 });

      // Đợi title sản phẩm xuất hiện
      const ok = await waitForSelectorRetry(page, ".ty-product-block-title");
      if (!ok) {
        console.log("❌ Không tìm thấy tiêu đề sản phẩm sau nhiều lần thử");
        return { status: "NOT_FOUND" };
      }

      // Lấy dữ liệu sản phẩm
      const data = await page.evaluate(() => {
        const name = document.querySelector(".ty-product-block-title")?.innerText || "";
        const priceText = document.querySelector(".ty-price .ty-price-num")?.innerText || "";

        return {
          name: name.trim(),
          price: priceText.trim(),
          link: window.location.href,
        };
      });

      if (!data.name || !data.price) {
        console.log("⚠️ Không lấy được đủ dữ liệu sản phẩm");
        return { status: "NOT_FOUND" };
      }

      data.price = normalizePrice(data.price);

      return {
        ...data,
        status: "FOUND"
      };

    } catch (err) {
      console.error("❌ Handler chiemtai lỗi:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site Chiemtaimobile\n" + "=".repeat(100));
    }
  }
}

module.exports = ChiemtaiChiemtaimobileHandler;
