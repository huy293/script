function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function autoScroll(page, times = 20, delay = 500) {
    for (let i = 0; i < times; i++) {
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(delay);
    }
  }
  
  
  
  async function fillInput(page, selector, value, name) {
    try {
      console.log(`[fillForm] Chờ ${selector} hiển thị`);
      await page.waitForSelector(selector, { timeout: 3000, visible: true });
      const input = await page.$(selector);
      if (input) {
        await input.focus();
  
        await page.keyboard.down('Control');
        await page.keyboard.press('A');
        await page.keyboard.up('Control');
  
        await page.keyboard.press('Backspace');
  
        await input.type(value, { delay: 50 });
        console.log(`[fillForm] Đã điền giá trị vào ${name}`);
      } else {
        console.warn(`[fillForm] Không tìm thấy ${name} — bỏ qua`);
      }
    } catch (e) {
      console.warn(`[fillForm] Lỗi khi điền ${name}: ${e.message} — bỏ qua`);
    }
  }
  
  async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
      let foundComment = false;
      let lastError = null;
  
      for (let i = 1; i <= 3; i++) {
        try {
          console.log(`[fillForm] Lần ${i}: Cuộn xuống cuối trang trước khi tìm textarea`);
          await autoScroll(page);
  
          console.log(`[fillForm] Lần ${i}: Chờ textarea#comment xuất hiện (visible)`);
          await page.waitForSelector('textarea#comment', { timeout: 30000, visible: true });
  
          const commentInput = await page.$('textarea#comment');
          if (commentInput) {
            await commentInput.focus();
  
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
  
            await page.keyboard.press('Backspace');
  
            await commentInput.type(comment, { delay: 50 });
            console.log(`[fillForm] Lần ${i}: Đã điền textarea#comment`);
            foundComment = true;
            break;
          } else {
            throw new Error('Không tìm thấy textarea#comment');
          }
        } catch (e) {
          lastError = e;
          console.warn(`[fillForm] Lần ${i}: ${e.message}`);
          console.log('[fillForm] Đợi 500ms trước khi thử lại');
          await delay(500);
        }
      }
      if (author) await fillInput(page, 'input#author', author, 'input#author');
      if (email) await fillInput(page, 'input#email', email, 'input#email');
      if (website) await fillInput(page, 'input#url', website, 'input#url');
  
      console.log('[fillForm] Điền form xong');
    } catch (error) {
      console.error(`[fillForm.js] Lỗi khi điền form: ${error.message}`);
      throw error;
    }
  }
  
  module.exports = fillForm;
  