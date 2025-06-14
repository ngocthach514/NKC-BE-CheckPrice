const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const BaseHandler = require("../BaseHandler");
const { normalizePrice } = require("../../utils/price");
const { waitForSelectorRetry } = require("../../utils/wait");

puppeteer.use(StealthPlugin());

class HoplongHoplongtechHandler extends BaseHandler {
  async search(term) {
    console.log(`→ Mở trang chủ: ${this.site.url}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    try {
      await page.goto(this.site.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      console.log(`→ Gửi từ khóa tìm kiếm: "${term}"`);
      await page.type(".search-form__input > input", term);
      await page.keyboard.press("Enter");

      const ok = await waitForSelectorRetry(page, "#product-list > .product-list__item");
      if (!ok) {
        console.log("❌ Không tìm thấy selector sản phẩm sau nhiều lần thử");
        return { status: "NOT_FOUND" };
      }

      const product = await page.evaluate((term) => {
        let found = null;

        document.querySelectorAll("#product-list > .product-list__item").forEach(el => {
          const name = el.querySelector(".content h3 a")?.innerText.trim();
          const link = el.querySelector(".content h3 a")?.href;
          const price = el.querySelector(".price p")?.innerText.trim();
          let sku = null;

          try {
            const snapshot = el.getAttribute("wire:snapshot");
            if (snapshot) {
              const data = JSON.parse(snapshot.replace(/&quot;/g, '"'));
              sku = data?.data?.product?.[0]?.sku;
            }
          } catch (e) {}

          if (sku && sku.toLowerCase() === term.toLowerCase()) {
            found = { name, link, price };
          }
        });

        return found;
      }, term);

      if (!product) {
        console.log(`❌ Không tìm thấy link sản phẩm cho từ khóa '${term}'`);
        return { status: "NOT_FOUND" };
      }

      const price = normalizePrice(product.price || '');

      console.log(`✅ Tìm thấy sản phẩm: ${product.name} | Giá: ${price}`);
      return {
        name: product.name,
        link: product.link,
        price,
        status: "FOUND",
      };

    } catch (err) {
      console.error(`❌ LỖI tại site HỢP LONG: ${err.message}`);
      return { status: "ERROR", error: err.message };
    } finally {
      await browser.close();
      console.log("🔚 Kết thúc site HỢP LONG\n" + "=".repeat(100));
    }
  }
}

module.exports = HoplongHoplongtechHandler;
