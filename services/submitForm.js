function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async function submitForm(page) {
    try {
      // Tìm nút submit có thể là button hoặc input với id submit
      const submitBtn = await page.$('button#submit, input#submit');
      if (!submitBtn) throw new Error('Không tìm thấy nút submit');
  
      await submitBtn.focus();
      await submitBtn.click();
  
      // Tùy chọn: đợi vài trăm ms để đảm bảo hành động click được xử lý xong
      await delay(300);
    } catch (error) {
      throw new Error(`[submitForm.js] Lỗi khi submit form: ${error.message}`);
    }
  }
  
  module.exports = submitForm;
  