async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      // Helper gán giá trị trực tiếp cho input/textarea, kèm check disabled hoặc readonly
      const setInputValue = async (selector, value, errorMsg) => {
        if (!value) return;
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          const isDisabledOrReadOnly = await page.$eval(selector, el => el.disabled || el.readOnly);
          if (isDisabledOrReadOnly) throw new Error(`${selector} bị disabled hoặc readonly`);
          
          await page.evaluate((sel, val) => {
            const element = document.querySelector(sel);
            element.value = val;
            // Tạo event input và change để trigger event listener nếu có
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }, selector, value);
        } catch (e) {
          throw new Error(`[setInputValue] Lỗi với selector "${selector}": ${e.message}`);
        }
      };
  
      // Điền comment (textarea)
      try {
        await setInputValue('textarea#comment', comment, 'Không tìm thấy textarea#comment');
      } catch (e) {
        throw new Error(`[fillForm - comment] ${e.message}`);
      }
  
      // Điền các trường còn lại
      await setInputValue('input#author', author, 'Không tìm thấy input#author');
      await setInputValue('input#email', email, 'Không tìm thấy input#email');
  
      if (website) {
        try {
          const hasWebsite = await page.$('input#url');
          if (hasWebsite) {
            await setInputValue('input#url', website, 'Không tìm thấy input#url');
          } else {
            console.warn('[fillForm] Không tìm thấy input#url — bỏ qua');
          }
        } catch (e) {
          throw new Error(`[fillForm - website] ${e.message}`);
        }
      }
  
      console.log('[fillForm] Điền form xong');
    } catch (error) {
      console.error('[fillForm] Lỗi:', error.message);
      throw new Error(`[fillForm.js] Lỗi khi điền form: ${error.message}`);
    }
  }
  
  module.exports = fillForm;
  