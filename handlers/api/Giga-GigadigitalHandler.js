const getAxiosWithProxy = require("../getAxiosWithProxy");
const axios = getAxiosWithProxy();
const BaseHandler = require('../BaseHandler');
const { normalizePrice } = require('../../utils/price');

class GigaGigadigitalHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);

    try {
      const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
      console.log(`→ Lấy dữ liệu từ URL: ${url}`);

      const res = await axios.get(url);
      const json = res.data;

      const keywordLower = keyword.toLowerCase();
      const product = json?.result?.find(p =>
        p.name?.toLowerCase().includes(keywordLower)
      );

      if (!product) {
        console.log(`❌ Kết quả cho site ${this.site.name}: KHÔNG TÌM THẤY với từ khóa '${keyword}' trong ${(json?.result || []).length} kết quả`);
        console.log(`🔚 Kết thúc site ${this.site.name}`);
        console.log("=".repeat(100));
        return { status: 'NOT_FOUND' };
      }

      const name = product.name || '[không có tên]';
      const rawPrice = String(product.price || '');
      const price = normalizePrice(rawPrice);
      const link = extractFirstHref(product.post, this.site.url) || '';

      console.log(`✅ Kết quả cho site ${this.site.name}: ${name} | Giá: ${price}`);
      console.log(`🔚 Kết thúc site ${this.site.name}`);
      console.log("=".repeat(100));

      return {
        name,
        price,
        link,
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

function extractFirstHref(html, siteUrl) {
  if (!html || typeof html !== 'string') return '';
  const matches = html.match(/<a\s[^>]*href="([^"]+)"[^>]*>/i);
  return matches?.[1]?.startsWith('http') ? matches[1] : `${siteUrl}${matches?.[1] || ''}`;
}

module.exports = GigaGigadigitalHandler;
