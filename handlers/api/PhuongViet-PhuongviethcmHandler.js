const axios = require("axios");
const BaseHandler = require("../BaseHandler");

class PhuongVietPhuongviethcmHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);

    try {
      const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));
      console.log(`→ Lấy dữ liệu từ URL: ${url}`);

      const res = await axios.get(url);
      const json = res.data;

      const keywordLower = keyword.toLowerCase();
      const product = json?.suggestions?.find(item =>
        item.type === 'Product' && item.value?.toLowerCase().includes(keywordLower)
      );

      if (!product) {
        console.log(`❌ Kết quả cho site ${this.site.name}: KHÔNG TÌM THẤY với từ khóa '${keyword}' trong ${(json?.suggestions || []).length} kết quả`);
        console.log(`🔚 Kết thúc site ${this.site.name}`);
        console.log("=".repeat(100));
        return { status: 'NOT_FOUND' };
      }

      const name = product.value || '[không có tên]';
      const rawPrice = stripHTML(product.price || '');
      const price = normalizePrice(rawPrice);
      const link = product.url || '';
      const serial = product.sku || product.productModel || product.code || null;

      console.log(`✅ Kết quả cho site ${this.site.name}: ${name} | Giá: ${price}`);
      console.log(`🔚 Kết thúc site ${this.site.name}`);
      console.log("=".repeat(100));

      return {
        name,
        price,
        link,
        serial,
        status: 'FOUND'
      };
    } catch (err) {
      console.log(`❌ LỖI tại site ${this.site.name}: ${err.message}`);
      console.log(`🔚 Kết thúc site ${this.site.name}`);
      console.log("=".repeat(100));
      return { status: 'ERROR', error: err.message };
    }
  }
}

function stripHTML(html) {
  return typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').trim()
    : html;
}

function normalizePrice(input) {
  if (!input) return "0.0";
  let text = String(input).toLowerCase().trim();

  if (text.includes('triệu')) {
    const num = parseFloat(text);
    return isNaN(num) ? "0.0" : (num * 1_000_000).toFixed(1);
  }
  if (text.includes('nghìn')) {
    const num = parseFloat(text);
    return isNaN(num) ? "0.0" : (num * 1_000).toFixed(1);
  }

  text = text.replace(/\./g, '').replace(/,/g, '.');
  const cleaned = text.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? "0.0" : parsed.toFixed(1);
}

module.exports = PhuongVietPhuongviethcmHandler;
