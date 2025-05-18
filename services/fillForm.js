async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      // Điền textarea#comment (bắt buộc), thử 3 lần
      let foundComment = false;
      let lastError = null;
      for (let i = 1; i <= 3; i++) {
        try {
          console.log(`[fillForm] Lần ${i}: Chờ selector textarea#comment`);
          await page.waitForSelector('textarea#comment', { timeout: 10000 });
          console.log(`[fillForm] Lần ${i}: Tìm thấy textarea#comment, chuẩn bị điền giá trị`);
          await page.evaluate((val) => {
            const el = document.querySelector('textarea#comment');
            if (!el || el.disabled || el.readOnly) throw new Error('textarea#comment không hợp lệ');
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, comment);
          console.log(`[fillForm] Lần ${i}: Đã điền giá trị vào textarea#comment`);
          foundComment = true;
          break;
        } catch (e) {
          lastError = e;
          console.log(`[fillForm] Lần ${i}: Lỗi hoặc không tìm thấy textarea#comment: ${e.message}`);
          console.log(`[fillForm] Lần ${i}: Cuộn xuống cuối trang và thử lại`);
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          console.log('[fillForm] Đợi 500ms trước khi thử lại');
          await page.waitForTimeout(500);
        }
      }
  
      if (!foundComment) {
        throw new Error(`[fillForm] Không tìm thấy textarea#comment sau 3 lần thử: ${lastError?.message}`);
      }
  
      // Điền input#author (không bắt buộc)
      if (author) {
        try {
          console.log('[fillForm] Chờ selector input#author');
          await page.waitForSelector('input#author', { timeout: 5000 });
          console.log('[fillForm] Tìm thấy input#author, chuẩn bị điền giá trị');
          await page.evaluate((val) => {
            const el = document.querySelector('input#author');
            if (!el || el.disabled || el.readOnly) throw new Error('input#author không hợp lệ');
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, author);
          console.log('[fillForm] Đã điền giá trị vào input#author');
        } catch (e) {
          console.warn(`[fillForm] Lỗi khi điền input#author: ${e.message} — bỏ qua`);
        }
      }
  
      // Điền input#email (không bắt buộc)
      if (email) {
        try {
          console.log('[fillForm] Chờ selector input#email');
          await page.waitForSelector('input#email', { timeout: 5000 });
          console.log('[fillForm] Tìm thấy input#email, chuẩn bị điền giá trị');
          await page.evaluate((val) => {
            const el = document.querySelector('input#email');
            if (!el || el.disabled || el.readOnly) throw new Error('input#email không hợp lệ');
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, email);
          console.log('[fillForm] Đã điền giá trị vào input#email');
        } catch (e) {
          console.warn(`[fillForm] Lỗi khi điền input#email: ${e.message} — bỏ qua`);
        }
      }
  
      // Điền input#url nếu có (không bắt buộc)
      if (website) {
        try {
          console.log('[fillForm] Kiểm tra tồn tại input#url');
          const hasWebsite = await page.$('input#url');
          if (hasWebsite) {
            console.log('[fillForm] Tìm thấy input#url, chuẩn bị điền giá trị');
            await page.waitForSelector('input#url', { timeout: 5000 });
            await page.evaluate((val) => {
              const el = document.querySelector('input#url');
              if (!el || el.disabled || el.readOnly) throw new Error('input#url không hợp lệ');
              el.value = val;
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, website);
            console.log('[fillForm] Đã điền giá trị vào input#url');
          } else {
            console.warn('[fillForm] Không tìm thấy input#url — bỏ qua');
          }
        } catch (e) {
          console.warn(`[fillForm] Lỗi khi điền input#url: ${e.message} — bỏ qua`);
        }
      }
  
      console.log('[fillForm] Điền form xong');
    } catch (error) {
      const errorMessage = `[fillForm.js] Lỗi khi điền form: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  module.exports = fillForm;
  