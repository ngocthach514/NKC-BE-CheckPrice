const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

function normalizePrice(input) {
  if (!input || typeof input !== "string") return 0.0;

  const cleaned = input
    .replace(/[₫đ\s]/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '');

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0.0 : num;
}

(async () => {
  const keyword = "CK-902";
  const searchUrl = `https://mrweekend.vn/search?q=${encodeURIComponent(keyword)}&type=product`;

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  try {
    console.log("🔎 Truy cập:", searchUrl);
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    await page.waitForSelector(".grid-uniform .grid__item", { timeout: 10000 });

    const result = await page.evaluate((keyword) => {
      function toPlain(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      }

      const keywordNorm = toPlain(keyword);

      const items = Array.from(document.querySelectorAll(".grid-uniform .grid__item"));
      let bestMatch = null;
      let exactMatchScore = Infinity;

      for (let el of items) {
        const nameEl = el.querySelector(".product-name h2");
        const priceEl = el.querySelector(".current-price");
        const linkEl = el.querySelector(".a-product__image a");

        if (!nameEl || !priceEl || !linkEl) continue;

        const name = nameEl.innerText.trim();
        const priceText = priceEl.innerText.trim();
        const link = linkEl.href.startsWith("http") ? linkEl.href : "https://mrweekend.vn" + linkEl.getAttribute("href");

        const normName = toPlain(name);
        const index = normName.indexOf(keywordNorm);

        if (index !== -1 && index < exactMatchScore) {
          exactMatchScore = index;
          bestMatch = { name, priceText, link };
        }
      }

      return bestMatch;
    }, keyword);

    if (!result) {
      console.log("❌ Không tìm thấy sản phẩm khớp keyword.");
    } else {
      console.log("🎯 Kết quả:", {
        name: result.name,
        price: normalizePrice(result.priceText),
        price_text: result.priceText,
        link: result.link
      });
    }

  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await browser.close();
  }
})();
