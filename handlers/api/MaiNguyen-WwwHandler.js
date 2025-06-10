const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class MaiNguyenWwwHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = json?.pageProps?.searchData?.[0];
    if (!product) return { status: 'NOT_FOUND' };

    const productLink = `https://www.mainguyen.vn/${product.slug}`;

    return {
      name: product.name || '',
      price: String(product.price || ''),
      link: productLink,
      status: 'FOUND'
    };
  }
}

module.exports = MaiNguyenWwwHandler;
