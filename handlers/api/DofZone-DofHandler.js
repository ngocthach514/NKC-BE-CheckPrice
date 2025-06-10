const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class DofZoneDofHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = json?.products?.[0];
    if (!product) return { status: 'NOT_FOUND' };

    return {
      name: product.name || '',
      price: String(product.price || ''),
      link: product.viewLink?.startsWith('http')
        ? product.viewLink
        : `${this.site.url}${product.viewLink}`,
      status: 'FOUND'
    };
  }
}

module.exports = DofZoneDofHandler;
