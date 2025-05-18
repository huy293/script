async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      // Helper: điền giá trị vào trường input bằng page.type (ổn định hơn evaluate)
      const typeInputValue = async (selector, value, errorMsg) => {
        if (!value) return;
        const el = await page.$(selector);
        if (!el) throw new Error(errorMsg);
        await page.focus(selector); // đảm bảo focus trước khi gõ
        await page.type(selector, value, { delay: 30 });
      };
  
      // Check và điền comment
      const hasComment = await page.$('textarea#comment');
      if (!hasComment) throw new Error('Không tìm thấy textarea#comment');
      await page.focus('textarea#comment');
      await page.type('textarea#comment', comment, { delay: 30 });
  
      // Điền các trường còn lại
      await typeInputValue('input#author', author, 'Không tìm thấy input#author');
      await typeInputValue('input#email', email, 'Không tìm thấy input#email');
  
      if (website) {
        // Một số theme có thể không có input#url
        const hasWebsite = await page.$('input#url');
        if (hasWebsite) {
          await typeInputValue('input#url', website, 'Không tìm thấy input#url');
        } else {
          console.warn('[fillForm] Không tìm thấy input#url — bỏ qua');
        }
      }
  
      console.log('[fillForm] Điền form xong');
    } catch (error) {
      console.error('[fillForm] Lỗi:', error.message);
      throw new Error(`[fillForm.js] Lỗi khi điền form: ${error.message}`);
    }
  }
  
  module.exports = fillForm;
  