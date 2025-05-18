async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      const setInputValue = async (selector, value) => {
        if (!value) return;
        await page.waitForSelector(selector, { timeout: 10000 });
  
        // Kiểm tra disabled hoặc readonly an toàn
        const isDisabledOrReadOnly = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null; // chưa có element
          return el.disabled || el.readOnly;
        }, selector);
  
        if (isDisabledOrReadOnly === null) {
          throw new Error(`${selector} chưa có trên DOM`);
        } else if (isDisabledOrReadOnly) {
          throw new Error(`${selector} bị disabled hoặc readonly`);
        }
  
        await page.evaluate((sel, val) => {
          const element = document.querySelector(sel);
          element.value = val;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }, selector, value);
      };
  
      let foundComment = false;
      let lastError = null;
      for (let i = 1; i <= 3; i++) {
        try {
          await setInputValue('textarea#comment', comment);
          foundComment = true;
          break;
        } catch (e) {
          lastError = e;
          console.log(`[fillForm] Lần ${i} chưa tìm thấy textarea#comment, sẽ cuộn xuống cuối trang và thử lại`);
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(500); // đợi DOM ổn định hơn
        }
      }
      if (!foundComment) throw new Error(`[fillForm] Không tìm thấy textarea#comment sau 3 lần thử: ${lastError?.message}`);
  
      await setInputValue('input#author', author);
      await setInputValue('input#email', email);
  
      if (website) {
        const hasWebsite = await page.$('input#url');
        if (hasWebsite) {
          await setInputValue('input#url', website);
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
  