const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class MiworldMiworldHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = json?.suggestions?.[0]?.data;
    const link = json?.suggestions?.[0]?.value;

    if (!product || !link) return { status: 'NOT_FOUND' };

    return {
      name: product.text || '',
      price: stripHTML(product.price || 'Liên hệ' || ''),
      link: link,
      status: 'FOUND'
    };
  }
}

function stripHTML(html) {
  return typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').trim()
    : html;
}

module.exports = MiworldMiworldHandler;
