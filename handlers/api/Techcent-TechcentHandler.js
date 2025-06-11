const axios = require("axios");
const BaseHandler = require("../BaseHandler");

class TechcentTechcentHandler extends BaseHandler {
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

      if (!json?.results || !Array.isArray(json.results)) {
        console.log(`⚠️ ${this.site.name}: Cấu trúc JSON không đúng hoặc thiếu 'results'`);
        console.log(`🔚 Kết thúc site ${this.site.name}`);
        console.log("=".repeat(100));
        return { status: 'ERROR', error: "Cấu trúc JSON không hợp lệ" };
      }

      const keywordLower = keyword.toLowerCase();
      const product = json.results.find(item =>
        item.title?.toLowerCase().includes(keywordLower)
      );

      if (!product) {
        console.log(`❌ Kết quả cho site ${this.site.name}: KHÔNG TÌM THẤY với từ khóa '${keyword}' trong ${json.results.length} kết quả`);
        console.log(`🔚 Kết thúc site ${this.site.name}`);
        console.log("=".repeat(100));
        return { status: 'NOT_FOUND' };
      }

      const rawPrice = product.price || '';
      const price = normalizePrice(stripHTML(rawPrice));
      const title = product.title || '[không có tên]';
      const link = product.url?.startsWith('http') ? product.url : `${this.site.url}${product.url}`;
      const serial = product.sku || product.productModel || product.code || null;

      console.log(`✅ Kết quả cho site ${this.site.name}: ${title} | Giá: ${price}`);
      console.log(`🔚 Kết thúc site ${this.site.name}`);
      console.log("=".repeat(100));

      return {
        name: title,
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
  return typeof html === 'string' ? html.replace(/<[^>]*>/g, '').trim() : html;
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

module.exports = TechcentTechcentHandler;
