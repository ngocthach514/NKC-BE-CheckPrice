const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// Hàm chuẩn hóa giá dành riêng cho Wanbo.vn
function normalizeWanboPrice(input) {
  if (!input || typeof input !== 'string') return 0.0;

  const cleaned = input
    .replace(/[₫đ\s]/gi, '')   // bỏ ký hiệu tiền, khoảng trắng
    .replace(/\./g, '')        // bỏ dấu chấm
    .replace(/,/g, '');        // bỏ dấu phẩy

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0.0 : num;
}

(async () => {
  const url = "https://wanbo.vn/san-pham/may-chieu-xiaomi-wanbo-vali-1-model-2025/";

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    console.log("🔎 Truy cập:", url);
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector(".zek_detail_info", { timeout: 10000 });

    const data = await page.evaluate(() => {
      const wrap = document.querySelector(".zek_detail_info");

      const name = wrap.querySelector("h1.product_title")?.innerText.trim() || null;

      const priceText = wrap.querySelector("p.price ins .amount")?.innerText.trim()
                      || wrap.querySelector("p.price .amount")?.innerText.trim()
                      || null;

      const originalPriceText = wrap.querySelector("p.price del .amount")?.innerText.trim() || null;

      const link = wrap.querySelector("form.cart")?.getAttribute("action") || window.location.href;

      return { name, priceText, originalPriceText, link };
    });

    const result = {
      name: data.name,
      price: normalizeWanboPrice(data.priceText),
      original_price: normalizeWanboPrice(data.originalPriceText),
      link: data.link
    };

    console.log("🎯 Kết quả:", result);
  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  }
})();
