async function fillForm(page, { author, email, comment, website }) {
    try {
      console.log('[fillForm] Bắt đầu điền form');
  
      // Điền textarea#comment (bắt buộc), thử 3 lần
      let foundComment = false;
      let lastError = null;
  
      for (let i = 1; i <= 3; i++) {
        try {
          console.log(`[fillForm] Lần ${i}: Tìm textarea#comment`);
          const commentInput = await page.$('textarea#comment');
  
          if (commentInput) {
            await commentInput.click({ clickCount: 3 });
            await commentInput.type(comment, { delay: 10 });
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
          await page.waitForTimeout(500);
        }
      }
  
      if (!foundComment) {
        throw new Error(`[fillForm] Không tìm thấy textarea#comment sau 3 lần thử: ${lastError?.message}`);
      }
  
      // Điền input#author (không bắt buộc)
      if (author) {
        try {
          console.log('[fillForm] Tìm input#author');
          const authorInput = await page.$('input#author');
          if (authorInput) {
            await authorInput.click({ clickCount: 3 });
            await authorInput.type(author, { delay: 10 });
            console.log('[fillForm] Đã điền giá trị vào input#author');
          } else {
            console.warn('[fillForm] Không tìm thấy input#author — bỏ qua');
          }
        } catch (e) {
          console.warn(`[fillForm] Lỗi khi điền input#author: ${e.message} — bỏ qua`);
        }
      }
  
      // Điền input#email (không bắt buộc)
      if (email) {
        try {
          console.log('[fillForm] Tìm input#email');
          const emailInput = await page.$('input#email');
          if (emailInput) {
            await emailInput.click({ clickCount: 3 });
            await emailInput.type(email, { delay: 10 });
            console.log('[fillForm] Đã điền giá trị vào input#email');
          } else {
            console.warn('[fillForm] Không tìm thấy input#email — bỏ qua');
          }
        } catch (e) {
          console.warn(`[fillForm] Lỗi khi điền input#email: ${e.message} — bỏ qua`);
        }
      }
  
      // Điền input#url (không bắt buộc)
      if (website) {
        try {
          console.log('[fillForm] Tìm input#url');
          const websiteInput = await page.$('input#url');
          if (websiteInput) {
            await websiteInput.click({ clickCount: 3 });
            await websiteInput.type(website, { delay: 10 });
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
  