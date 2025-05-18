async function fillForm(page, { author, email, comment, website }) {
    try {
      // Kiểm tra textarea comment
      const hasComment = await page.$('textarea#comment');
      if (!hasComment) throw new Error('Không tìm thấy textarea#comment');
  
      await page.evaluate(comment => {
        const el = document.querySelector('textarea#comment');
        el.value = comment;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, comment);
  
      const setInputValue = async (selector, value, errorMsg) => {
        if (!value) return;
        const el = await page.$(selector);
        if (!el) throw new Error(errorMsg);
        await page.evaluate((sel, val) => {
          const el = document.querySelector(sel);
          el.value = val;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, selector, value);
      };
  
      await setInputValue('input#author', author, 'Không tìm thấy input#author');
      await setInputValue('input#email', email, 'Không tìm thấy input#email');
      await setInputValue('input#url', website, 'Không tìm thấy input#url');
    } catch (error) {
      throw new Error(`[fillForm.js] Lỗi khi điền form: ${error.message}`);
    }
  }
  
  module.exports = fillForm;
  