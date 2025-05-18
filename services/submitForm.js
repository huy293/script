function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function submitForm(page) {
    try {
      const submitBtn = await page.$('button#submit, input#submit');
      if (!submitBtn) throw new Error('Không tìm thấy nút submit');
  
      await submitBtn.focus();
      await submitBtn.click();
  
      await delay(5000);
    } catch (error) {
      throw new Error(`[submitForm.js] Lỗi khi submit form: ${error.message}`);
    }
  }
  
  module.exports = submitForm;
  