function normalizePrice(input) {
  if (!input || typeof input !== 'string') return "0.0";

  const cleanedText = input
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .replace(/[₫đ]/gi, '')
    .toLowerCase()
    .trim();

  if (/triệu/.test(cleanedText)) {
    const matches = cleanedText.match(/[\d.,]+/g);
    if (!matches) return "0.0";
    const values = matches
      .map(m => parseFloat(m.replace(/\./g, '').replace(/,/g, '.')))
      .filter(n => !isNaN(n))
      .map(n => n * 1_000_000);
    return values.length ? Math.min(...values).toFixed(1) : "0.0";
  }

  if (/nghìn|ngàn/.test(cleanedText)) {
    const matches = cleanedText.match(/[\d.,]+/g);
    if (!matches) return "0.0";
    const values = matches
      .map(m => parseFloat(m.replace(/\./g, '').replace(/,/g, '.')))
      .filter(n => !isNaN(n))
      .map(n => n * 1_000);
    return values.length ? Math.min(...values).toFixed(1) : "0.0";
  }

  const matches = cleanedText.match(/[\d.,]+/g);
  const values = (matches || [])
    .map(m => parseFloat(m.replace(/\./g, '').replace(/,/g, '.')))
    .filter(n => !isNaN(n));

  if (values.length === 0) return "0.0";

  return Math.min(...values).toFixed(1);
}

function stripHTML(html) {
  return typeof html === 'string'
    ? html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '').trim()
    : html;
}

module.exports = {
  normalizePrice,
  stripHTML,
};
