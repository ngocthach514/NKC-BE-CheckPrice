const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class TechcentTechcentHandler extends BaseHandler {
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
      price: stripHTML(product.price || ''),
      link: product.url?.startsWith('http')
        ? product.url
        : `${this.site.url}${product.url}`,
      status: 'FOUND'
    };
  }
}

function stripHTML(html) {
  return typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').trim()
    : html;
}

module.exports = TechcentTechcentHandler;
