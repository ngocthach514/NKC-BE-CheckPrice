const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class KhanhVyHomeKhanhvyhomeHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = json?.results?.[0];
    if (!product) return { status: 'NOT_FOUND' };

    return {
      name: product.title || '',
      price: Math.round(product.price / 1000),
      link: product.url?.startsWith('http')
        ? product.url
        : `${this.site.url}${product.url}`,
      status: 'FOUND'
    };
  }
}

module.exports = KhanhVyHomeKhanhvyhomeHandler;
