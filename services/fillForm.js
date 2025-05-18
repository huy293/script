function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      // Điền textarea#comment (bắt buộc), thử 3 lần
      let foundComment = false;
      let lastError = null;
  
      for (let i = 1; i <= 3; i++) {
        try {
          console.log(`[fillForm] Lần ${i}: Chờ textarea#comment xuất hiện`);
          await page.waitForSelector('textarea#comment', { timeout: 3000 });
          const commentInput = await page.$('textarea#comment');
  
          if (commentInput) {
            await commentInput.focus();
            await page.evaluate(el => el.value = '', commentInput);
            await commentInput.type(comment, { delay: 50 });
            console.log(`[fillForm] Lần ${i}: Đã điền giá trị vào textarea#comment`);
            foundComment = true;
            break;
          } else {
            throw new Error('Không tìm thấy textarea#comment');
          }
        } catch (e) {
          lastError = e;
          console.warn(`[fillForm] Lần ${i}: ${e.message}`);
          console.log('[fillForm] Cuộn xuống cuối trang và đợi 500ms trước khi thử lại');
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          await delay(500);

        }
      }
  
      if (!foundComment) {
        throw new Error(`[fillForm] Không tìm thấy textarea#comment sau 3 lần thử: ${lastError?.message}`);
      }
  
      // Hàm helper điền input text
      async function fillInput(selector, value, name) {
        try {
          console.log(`[fillForm] Chờ ${selector}`);
          await page.waitForSelector(selector, { timeout: 3000 });
          const input = await page.$(selector);
          if (input) {
            await input.focus();
            await page.evaluate(el => el.value = '', input);
            await input.type(value, { delay: 50 });
            console.log(`[fillForm] Đã điền giá trị vào ${name}`);
          } else {
            console.warn(`[fillForm] Không tìm thấy ${name} — bỏ qua`);
          }
        } catch (e) {
          console.warn(`[fillForm] Lỗi khi điền ${name}: ${e.message} — bỏ qua`);
        }
      }
  
      // Điền các input không bắt buộc
      if (author) await fillInput('input#author', author, 'input#author');
      if (email) await fillInput('input#email', email, 'input#email');
      if (website) await fillInput('input#url', website, 'input#url');
  
      console.log('[fillForm] Điền form xong');
    } catch (error) {
      const errorMessage = `[fillForm.js] Lỗi khi điền form: ${error.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  module.exports = fillForm;
  