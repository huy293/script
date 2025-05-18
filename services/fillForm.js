async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      const setInputValue = async (selector, value, isRequired = false) => {
        if (!value) {
          if (isRequired) throw new Error(`${selector} là trường bắt buộc nhưng không có giá trị`);
          else return; // Không có value thì bỏ qua
        }
  
        try {
          await page.waitForSelector(selector, { timeout: 10000 });
  
          const isDisabledOrReadOnly = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            return el.disabled || el.readOnly;
          }, selector);
  
          if (isDisabledOrReadOnly === null) {
            const msg = `${selector} chưa có trên DOM`;
            if (isRequired) throw new Error(msg);
            else {
              console.warn(`[fillForm] ${msg} — bỏ qua`);
              return;
            }
          } else if (isDisabledOrReadOnly) {
            const msg = `${selector} bị disabled hoặc readonly`;
            if (isRequired) throw new Error(msg);
            else {
              console.warn(`[fillForm] ${msg} — bỏ qua`);
              return;
            }
          }
  
          await page.evaluate((sel, val) => {
            const element = document.querySelector(sel);
            element.value = val;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }, selector, value);
        } catch (e) {
          if (isRequired) throw e;
          else console.warn(`[fillForm] Lỗi khi điền ${selector}: ${e.message} — bỏ qua`);
        }
      };
  
      // Bắt buộc phải điền comment, thử 3 lần nếu không tìm được
      let foundComment = false;
      let lastError = null;
      for (let i = 1; i <= 3; i++) {
        try {
          await setInputValue('textarea#comment', comment, true);
          foundComment = true;
          break;
        } catch (e) {
          lastError = e;
          console.log(`[fillForm] Lần ${i} chưa tìm thấy textarea#comment hoặc lỗi, sẽ cuộn xuống cuối trang và thử lại`);
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await page.waitForTimeout(500);
        }
      }
  
      if (!foundComment) throw new Error(`[fillForm] Không tìm thấy textarea#comment sau 3 lần thử: ${lastError?.message}`);
  
      // Các trường còn lại không bắt buộc
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
      const errorMessage = `[fillForm.js] Lỗi khi điền form: ${error.message}`;
      console.error(errorMessage); // ✅ Ghi log để Railway hoặc server bắt được
      throw new Error(errorMessage);
    }
  }
  
  module.exports = fillForm;
  