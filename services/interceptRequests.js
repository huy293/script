async function setupRequestInterception(page) {
    try {
      await page.setRequestInterception(true);
      page.on('request', req => {
        const blocked = ['image', 'stylesheet', 'font', 'media'];
        if (blocked.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
    } catch (error) {
      throw new Error(`[interceptRequests.js] Lỗi khi thiết lập request interception: ${error.message}`);
    }
  }
  
  module.exports = setupRequestInterception;
  