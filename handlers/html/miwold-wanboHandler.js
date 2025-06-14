const BaseHandler = require("../BaseHandler");
const getBrowserWithProxy = require("../getBrowserWithProxy");
const { waitForSelectorRetry } = require("../../utils/wait");

require("dotenv").config();

function normalizeWanboPrice(input) {
  if (!input || typeof input !== 'string') return 0.0;
  const cleaned = input.replace(/[₫đ\s]/gi, '').replace(/\./g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0.0 : num;
}

class MiwoldWanboHandler extends BaseHandler {
  constructor(options) {
    super({ ...options, handler_key: "miwold-wanbo" });
  }

  async search(keyword) {
    let browser;
    try {
      browser = await getBrowserWithProxy();
      const page = await browser.newPage();

      const { PROXY_USERNAME, PROXY_PASSWORD } = process.env;
      if (PROXY_USERNAME && PROXY_PASSWORD) {
        await page.authenticate({
          username: PROXY_USERNAME,
          password: PROXY_PASSWORD,
        });
      }

      const searchUrl = `https://wanbo.vn/?s=${encodeURIComponent(keyword)}&post_type=product`;
      console.log(`🔎 Truy cập trang tìm kiếm: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 10000 });

      const ok = await waitForSelectorRetry(page, ".product form.cart", 2, 1000);
      if (!ok) {
        console.log("❌ Không tìm thấy sản phẩm nào.");
        return { status: "NOT_FOUND" };
      }

      const productUrl = await page.evaluate(() => {
        const form = document.querySelector(".product form.cart");
        return form?.getAttribute("action") || window.location.href;
      });

      if (!productUrl) {
        console.log("❌ Không lấy được link sản phẩm từ form.cart");
        return { status: "NOT_FOUND" };
      }

      console.log(`→ Truy cập trang chi tiết: ${productUrl}`);
      await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 10000 });

      const ready = await waitForSelectorRetry(page, ".zek_detail_info", 2, 1000);
      if (!ready) {
        console.log("❌ Không tìm thấy .zek_detail_info sau nhiều lần thử.");
        return { status: "NOT_FOUND" };
      }

      const data = await page.evaluate(() => {
        const wrap = document.querySelector(".zek_detail_info");
        const name = wrap.querySelector("h1.product_title")?.innerText.trim() || "";
        const priceText = wrap.querySelector("p.price ins .amount")?.innerText.trim()
          || wrap.querySelector("p.price .amount")?.innerText.trim() || "";
        const originalPriceText = wrap.querySelector("p.price del .amount")?.innerText.trim() || "";
        const link = wrap.querySelector("form.cart")?.getAttribute("action") || window.location.href;
        const image = document.querySelector("img.wp-post-image")?.src || "";

        return {
          name,
          priceText,
          originalPriceText,
          link,
          image,
        };
      });

      if (!data.name || !data.priceText) {
        console.log("❌ Thiếu thông tin sản phẩm.");
        return { status: "NOT_FOUND" };
      }

      const result = {
        name: data.name,
        price: normalizeWanboPrice(data.priceText),
        original_price: normalizeWanboPrice(data.originalPriceText),
        link: data.link,
        image: data.image,
        status: "FOUND",
      };

      return result;

    } catch (err) {
      console.error("❌ Lỗi xử lý MIWOLD-WANBO:", err.message);
      return { status: "ERROR", error: err.message };
    } finally {
      if (browser) {
        await browser.close();
        console.log("🔚 Kết thúc MIWOLD-WANBO\n" + "=".repeat(80));
      }
    }
  }
}

module.exports = MiwoldWanboHandler;
