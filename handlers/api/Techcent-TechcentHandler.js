const getAxiosWithProxy = require("../getAxiosWithProxy");
const axios = getAxiosWithProxy();
const BaseHandler = require("../BaseHandler");
const { normalizePrice, stripHTML } = require("../../utils/price");

class TechcentTechcentHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);

    try {
      const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));
      const res = await axios.get(url);
      const json = res.data;

      if (!Array.isArray(json?.results)) {
        return { status: 'ERROR', error: "Cấu trúc JSON không hợp lệ" };
      }

      const product = json.results.find(item =>
        item.title?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!product) return { status: 'NOT_FOUND' };

      const name = product.title || '[không có tên]';
      const price = normalizePrice(stripHTML(product.price || ''));
      const link = product.url?.startsWith('http') ? product.url : `${this.site.url}${product.url}`;
      const serial = product.sku || product.productModel || product.code || null;

      return { name, price, link, serial, status: 'FOUND' };
    } catch (err) {
      return { status: 'ERROR', error: err.message };
    }
  }
}

module.exports = TechcentTechcentHandler;
