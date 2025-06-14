function normalizePrice(input) {
  if (!input || typeof input !== 'string') return "0.0";

  const cleaned = input
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .replace(/[₫đ]/gi, '')
    .toLowerCase()
    .trim();

  // 1. Nếu có "triệu"
  if (/triệu/.test(cleaned)) {
    const match = cleaned.match(/([\d.,]+)/);
    if (!match) return "0.0";
    const number = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
    return isNaN(number) ? "0.0" : (number * 1_000_000).toFixed(0);
  }

  // 2. Nếu có "ngàn" hoặc "nghìn"
  if (/nghìn|ngàn/.test(cleaned)) {
    const match = cleaned.match(/([\d.,]+)/);
    if (!match) return "0.0";
    const number = parseFloat(match[1].replace(/\./g, '').replace(/,/g, '.'));
    return isNaN(number) ? "0.0" : (number * 1_000).toFixed(0);
  }

  // 3. Mặc định: dạng số đầy đủ
  const match = cleaned.match(/[\d.,]+/g);
  if (!match) return "0.0";

  const numbers = match
    .map(n => parseFloat(n.replace(/\./g, '').replace(/,/g, '')))
    .filter(n => !isNaN(n));

  return numbers.length ? Math.min(...numbers).toFixed(0) : "0.0";
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
