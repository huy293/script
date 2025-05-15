function validUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }
  
  module.exports = validUrl;
  