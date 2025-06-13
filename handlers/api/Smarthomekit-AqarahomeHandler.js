const getAxiosWithProxy = require("../getAxiosWithProxy");
const axios = getAxiosWithProxy();
const BaseHandler = require("../BaseHandler");
const { normalizePrice, stripHTML } = require("../../utils/price");

class SmarthomekitAqarahomeHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);
    try {
      const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));
      const res = await axios.get(url);
      const json = res.data;

      const suggestions = json?.suggestions || [];
      const keywordLower = keyword.toLowerCase();

      let product = suggestions.find(item =>
        item.type === 'Product' && item.value?.toLowerCase() === keywordLower
      ) || suggestions.find(item =>
        item.type === 'Product' && item.value?.toLowerCase().includes(keywordLower)
      );

      if (!product) return { status: 'NOT_FOUND' };

      const name = product.value || '[không có tên]';
      const price = normalizePrice(stripHTML(product.price || ''));
      const link = product.url || '';
      const serial = product.sku || product.productModel || product.code || name;

      return { name, price, link, serial, status: 'FOUND' };
    } catch (err) {
      return { status: 'ERROR', error: err.message };
    }
  }
}

module.exports = SmarthomekitAqarahomeHandler;
