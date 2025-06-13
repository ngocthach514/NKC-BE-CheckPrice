const getAxiosWithProxy = require("../getAxiosWithProxy");
const axios = getAxiosWithProxy();
const BaseHandler = require("../BaseHandler");
const { normalizePrice, stripHTML } = require("../../utils/price");

class SmarthomekitSmarthomekitHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    console.log(`🔍 Bắt đầu cho site: ${this.site.name}`);

    try {
      const url = this.site.api_url.replace("{keyword}", encodeURIComponent(keyword));
      const res = await axios.get(url);
      const json = res.data;

      const list = json?.suggestions || json?.results || json?.products || [];
      const keywordLower = keyword.toLowerCase();

      let result = list.find(item =>
        (item.value || item.name || '').toLowerCase() === keywordLower
      ) || list.find(item =>
        (item.value || item.name || '').toLowerCase().includes(keywordLower)
      );

      if (!result) return { status: 'NOT_FOUND' };

      const name = result?.value || result?.name || '[không có tên]';
      const rawPrice = result?.price || result?.priceText || result?.price_html || '';
      const price = normalizePrice(stripHTML(rawPrice));
      const link = result?.url || result?.viewLink || '';
      const serial = result.sku || result.productModel || result.code || name;

      return { name, price, link, serial, status: 'FOUND' };
    } catch (err) {
      return { status: 'ERROR', error: err.message };
    }
  }
}

module.exports = SmarthomekitSmarthomekitHandler;
