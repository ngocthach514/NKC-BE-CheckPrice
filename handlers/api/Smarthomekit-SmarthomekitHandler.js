const axios = require("axios");
const BaseHandler = require("../BaseHandler");

class SmarthomekitSmarthomekitHandler extends BaseHandler {
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
      const list = json?.suggestions || json?.results || json?.products || [];
      console.log(`📋 Có ${list.length} sản phẩm trong danh sách`);

      let result = list.find(item =>
        (item.value || item.name || '').toLowerCase() === keywordLower
      );

      if (!result) {
        result = list.find(item =>
          (item.value || item.name || '').toLowerCase().includes(keywordLower)
        );
      }

      if (!result) {
        console.log(`❌ Không tìm thấy sản phẩm phù hợp với từ khóa '${keyword}'`);
        console.log(`🔚 Kết thúc site ${this.site.name}`);
        console.log("=".repeat(100));
        return { status: 'NOT_FOUND' };
      }

      const name = result?.value || result?.name || '[không có tên]';
      const rawPrice = result?.price || result?.priceText || result?.price_html || '';
      const price = normalizePrice(stripHTML(rawPrice));
      const link = result?.url || result?.viewLink || '';
      const serial = result.sku || result.productModel || result.code || null;

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
    ? html.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').trim()
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

module.exports = SmarthomekitSmarthomekitHandler;
