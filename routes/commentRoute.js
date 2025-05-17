const express = require('express');
const router = express.Router();
const validUrl = require('../utils/urlValidator');
const postComment = require('../services/commentService');

router.get('/comment', async (req, res) => {
  const url = "https://www.vivoglobal.ph/vivo-origin-os/";
  const author = "Vivo";
  const email = "a@gmail.com";
  const comment = "Vivo";
  const website = "https://www.vivoglobal.ph/vivo-origin-os/";
  if (!validUrl(url)) {
    return res.status(400).json({ status: 'error', message: 'Invalid URL', urlReceived: url });
  }

  try {
    const result = await postComment({ url, author, email, comment, website });
    res.json(result);
  } catch (error) {
    console.error('comment error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});
module.exports = router;
