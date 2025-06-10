const axios = require('axios');
const BaseHandler = require('../BaseHandler');

class GigaGigadigitalHandler extends BaseHandler {
  constructor(site) {
    super(site);
  }

  async search(keyword) {
    const url = this.site.api_url.replace('{keyword}', encodeURIComponent(keyword));
    const res = await axios.get(url);
    const json = res.data;

    const product = json?.result?.[0];
    if (!product) return { status: 'NOT_FOUND' };

    const link = extractFirstHref(product.post) || '';

    return {
      name: product.name || '',
      price: String(product.price || ''),
      link,
      status: 'FOUND'
    };
  }
}

function extractFirstHref(html) {
  if (!html || typeof html !== 'string') return '';
  const matches = html.match(/<a\s[^>]*href="([^"]+)"[^>]*>/i);
  return matches?.[1]?.startsWith('http') ? matches[1] : `${this.site.url}${matches?.[1] || ''}`;
}

module.exports = GigaGigadigitalHandler;
