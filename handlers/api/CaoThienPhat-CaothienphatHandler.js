const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class CaoThienPhatCaothienphatHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = json?.suggestions?.find(item => item.type === 'Product');
    if (!product) return { status: 'NOT_FOUND' };

    return {
      name: product.value || '',
      price: stripHTML(product.price || ''),
      link: product.url || '',
      status: 'FOUND'
    };
  }
}

function stripHTML(html) {
  return typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').trim()
    : html;
}

module.exports = CaoThienPhatCaothienphatHandler;
