const BaseHandler = require("../BaseHandler");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { normalizePrice } = require("../../utils/price");
const { waitForSelectorRetry } = require("../../utils/wait");

require("dotenv").config();
puppeteer.use(StealthPlugin());

class MattervietnamMattervnHandler extends BaseHandler {
  constructor(options) {
    super({ ...options, handler_key: "mattervietnam-mattervn" });
  }

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
      await page.authenticate({ username: PROXY_USERNAME, password: PROXY_PASSWORD });
    }

    try {
      const searchUrl = `https://mattervn.com/?s=${encodeURIComponent(keyword)}&post_type=product`;
      console.log(`🔎 Truy cập: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // 👉 Tìm link sản phẩm đầu tiên khớp từ khóa
      const productLink = await page.evaluate((keyword) => {
        function toPlainText(str) {
          return str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
        }

        const normKeyword = toPlainText(keyword);
        const words = normKeyword.split(" ").filter(w => w.length > 2);

        const nodes = Array.from(document.querySelectorAll("p.product_title a"));

        const match = nodes.find(a => {
          const text = toPlainText(a.innerText || "");
          return words.every(w => text.includes(w));
        });

        return match?.href || null;
      }, keyword);

      if (!productLink) {
        console.log("❌ Không tìm thấy link sản phẩm");
        return { status: "NOT_FOUND" };
      }

      console.log(`→ Tìm thấy link sản phẩm: ${productLink}`);
      await page.goto(productLink, { waitUntil: "networkidle2", timeout: 30000 });

      const ok = await waitForSelectorRetry(page, ".product_title, .bk-product-name");
      if (!ok) {
        console.log("❌ Không tìm thấy selector sản phẩm sau nhiều lần thử");
        return { status: "NOT_FOUND" };
      }

      // 👉 Trích xuất dữ liệu
      const data = await page.evaluate(() => {
        const name =
          document.querySelector(".bk-product-name")?.innerText ||
          document.querySelector("h1.product_title")?.innerText ||
          "";

        const priceText = document.querySelector(".bk-product-price")?.innerText ||
          document.querySelector(".price")?.innerText || "";

        const img = document.querySelector(".bk-product-image")?.src ||
          document.querySelector("img.wp-post-image")?.src || "";

        return {
          name: name.trim(),
          price: priceText.trim(),
          image: img,
          link: window.location.href,
        };
      });

      if (!data.name || !data.price) {
        console.log("❌ Thiếu thông tin sản phẩm");
        return { status: "NOT_FOUND" };
      }

      data.price = normalizePrice(data.price);

      return {
        ...data,
        status: "FOUND",
      };
    } catch (err) {
      console.error("❌ Lỗi xử lý MATTERVN:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site MATTER VN\n" + "=".repeat(100));
    }
  }
}

module.exports = MattervietnamMattervnHandler;
