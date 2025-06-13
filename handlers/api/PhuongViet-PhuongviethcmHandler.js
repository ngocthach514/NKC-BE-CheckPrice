const getAxiosWithProxy = require("../getAxiosWithProxy");
const axios = getAxiosWithProxy();
const BaseHandler = require("../BaseHandler");
const { normalizePrice, stripHTML } = require("../../utils/price");

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
        console.log(`❌ Không tìm thấy với từ khóa '${keyword}'`);
        return { status: 'NOT_FOUND' };
      }

      const name = product.value || '[không có tên]';
      const price = normalizePrice(stripHTML(product.price || ''));
      const link = product.url || '';
      const serial = product.sku || product.productModel || product.code || null;

      console.log(`✅ Kết quả: ${name} | Giá: ${price}`);
      return { name, price, link, serial, status: 'FOUND' };
    } catch (err) {
      console.log(`❌ LỖI: ${err.message}`);
      return { status: 'ERROR', error: err.message };
    }
  }
}

module.exports = PhuongVietPhuongviethcmHandler;
