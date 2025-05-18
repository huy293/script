async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      // Helper điền input với check element trước
      const typeInputValue = async (selector, value, errorMsg) => {
        if (!value) return;
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
          const isDisabledOrReadOnly = await page.$eval(selector, el => el.disabled || el.readOnly);
          if (isDisabledOrReadOnly) throw new Error(`${selector} bị disabled hoặc readonly`);
          await page.focus(selector);
          await page.click(selector, { clickCount: 3 }); // chọn hết để overwrite text cũ
          await page.type(selector, value, { delay: 10 });
        } catch (e) {
          throw new Error(`[typeInputValue] Lỗi với selector "${selector}": ${e.message}`);
        }
      };
  
      // Điền comment (textarea)
      try {
        await page.waitForSelector('textarea#comment', { timeout: 10000 });
        const isDisabledOrReadOnly = await page.$eval('textarea#comment', el => el.disabled || el.readOnly);
        if (isDisabledOrReadOnly) throw new Error('textarea#comment bị disabled hoặc readonly');
        await page.focus('textarea#comment');
        await page.click('textarea#comment', { clickCount: 3 });
        await page.type('textarea#comment', comment, { delay: 10 });
      } catch (e) {
        throw new Error(`[fillForm - comment] ${e.message}`);
      }
  
      // Điền các trường còn lại
      await typeInputValue('input#author', author, 'Không tìm thấy input#author');
      await typeInputValue('input#email', email, 'Không tìm thấy input#email');
  
      if (website) {
        try {
          const hasWebsite = await page.$('input#url');
          if (hasWebsite) {
            await typeInputValue('input#url', website, 'Không tìm thấy input#url');
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
  