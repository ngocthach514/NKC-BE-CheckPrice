async function waitForSelectorRetry(page, selector, maxAttempts = 5, delayMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const found = await page.$(selector);
    if (found) return true;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return false;
}

module.exports = { waitForSelectorRetry };
