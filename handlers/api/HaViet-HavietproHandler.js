const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const BaseHandler = require("../BaseHandler");
const { normalizePrice } = require("../../utils/price");

puppeteer.use(StealthPlugin());

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15"
];

const getRandomUserAgent = () => userAgents[Math.floor(Math.random() * userAgents.length)];

class HaVietHavietproHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);
    let browser;
    try {
      const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));

      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        ignoreHTTPSErrors: true
      });

      const page = await browser.newPage();

      await page.setRequestInterception(true);
      page.on("request", req => {
        const type = req.resourceType();
        if (["image", "stylesheet", "font", "media"].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(getRandomUserAgent());
      await page.setExtraHTTPHeaders({
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        Referer: this.site.url,
        Connection: "keep-alive"
      });

      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

      const bodyContent = await page.evaluate(() => document.body.textContent);
      let json;
      try {
        json = JSON.parse(bodyContent);
      } catch {
        return this._fail("Không thể phân tích JSON từ HTML");
      }

      const keywordLower = keyword.toLowerCase();
      const product = Array.isArray(json) ? json.find(p =>
        p.productModel?.toLowerCase().includes(keywordLower) ||
        p.productName?.toLowerCase().includes(keywordLower)) : null;

      if (!product) return this._notFound(json.length, keyword);

      const productUrl = product.productUrl?.startsWith("http")
        ? product.productUrl
        : `${this.site.url.replace(/\/$/, "")}${product.productUrl || ""}`;

      await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 60000 });
      await this._handleLocationPopup(page);

      let price = "0.0";
      try {
        await page.waitForFunction(() => {
          const el = document.querySelector(".price .red-co");
          return el && el.innerText.trim() !== "Liên hệ";
        }, { timeout: 5000 });

        const rawPrice = await page.$eval(".price .red-co", el => el.textContent.trim());
        price = normalizePrice(rawPrice);
      } catch {}

      console.log(`✅ Kết quả cho site ${this.site.name}: ${product.productName || "[không có tên]"} | Giá: ${price}`);
      return {
        name: product.productName || "",
        price,
        link: productUrl,
        serial: product.productModel || null,
        status: "FOUND"
      };
    } catch (error) {
      return this._fail(error.message);
    } finally {
      if (browser) await browser.close();
      console.log(`🔚 Kết thúc site ${this.site.name}`);
      console.log("=".repeat(100));
    }
  }

  async _handleLocationPopup(page) {
    try {
      await page.waitForSelector(".list-item-location a", { timeout: 3000 });
      await page.evaluate(() => {
        const link = document.querySelector(".list-item-location a");
        if (link) {
          const match = link.getAttribute("onclick")?.match(/setUserOption\('\w+', (\d+), '(.*?)'/);
          if (match) {
            const value = match[1];
            const returnUrl = match[2];
            window.location.href = `/ajax/user_set_option.php?key=user_location&value=${value}&return_url=` + encodeURIComponent(returnUrl);
          }
        }
      });
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 });
    } catch {}
  }

  _notFound(count, keyword) {
    console.log(`❌ Kết quả KHÔNG TÌM THẤY với từ khóa '${keyword}' trong ${count} kết quả`);
    return { status: "NOT_FOUND" };
  }

  _fail(message) {
    console.log(`❌ LỖI tại site ${this.site.name}: ${message}`);
    return { status: "ERROR", error: message };
  }
}

module.exports = HaVietHavietproHandler;
