const getAxiosWithProxy = require("../getAxiosWithProxy");
const axios = getAxiosWithProxy();
const https = require("https");
const BaseHandler = require("../BaseHandler");
const { normalizePrice, stripHTML } = require("../../utils/price");

class MiworldMiworldHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);

    try {
      const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));
      console.log(`→ Lấy dữ liệu từ URL: ${url}`);

      const agent = new https.Agent({ rejectUnauthorized: false });
      const res = await axios.get(url, { httpsAgent: agent });
      const json = res.data;

      const keywordLower = keyword.toLowerCase();
      const suggestion = json?.suggestions?.find(item =>
        item.data?.text?.toLowerCase().includes(keywordLower)
      );

      if (!suggestion || !suggestion.data || !suggestion.value) {
        console.log(`❌ Kết quả cho site ${this.site.name}: KHÔNG TÌM THẤY với từ khóa '${keyword}'`);
        console.log(`🔚 Kết thúc site ${this.site.name}`);
        console.log("=".repeat(100));
        return { status: "NOT_FOUND" };
      }

      const product = suggestion.data;
      const link = suggestion.value;
      const name = product.text || '[không có tên]';
      const rawPrice = stripHTML(product.price || 'Liên hệ');
      const price = normalizePrice(rawPrice);
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
      return { status: "ERROR", error: err.message };
    }
  }
}

module.exports = MiworldMiworldHandler;
