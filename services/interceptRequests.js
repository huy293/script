async function setupRequestInterception(page) {
    try {
      // Kích hoạt bắt request
      await page.setRequestInterception(true);
  
      page.on('request', (req) => {
        const blockedResourceTypes = ['image', 'stylesheet', 'font', 'media'];
  
        if (blockedResourceTypes.includes(req.resourceType())) {
          req.abort().catch(() => {}); // Bỏ qua lỗi nếu có
        } else {
          req.continue().catch(() => {}); // Bỏ qua lỗi nếu có
        }
      });
    } catch (error) {
      throw new Error(`[interceptRequests.js] Lỗi khi thiết lập request interception: ${error.message}`);
    }
  }
  
  module.exports = setupRequestInterception;
  