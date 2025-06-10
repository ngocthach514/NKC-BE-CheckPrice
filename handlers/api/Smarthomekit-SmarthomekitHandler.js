const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class SmarthomekitSmarthomekitHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const result = Array.isArray(json?.suggestions)
      ? json.suggestions[0]
      : json?.results?.[0] || json?.products?.[0];

    if (!result) return { status: 'NOT_FOUND' };

    return {
      name: result?.value || result?.name || '',
      price: stripHTML(result?.price || result?.priceText || result?.price_html || ''),
      link: result?.url || result?.viewLink || '',
      status: 'FOUND'
    };
  }
}

function stripHTML(html) {
  return typeof html === 'string' ? html.replace(/<[^>]+>/g, '').trim() : html;
}

module.exports = SmarthomekitSmarthomekitHandler;
