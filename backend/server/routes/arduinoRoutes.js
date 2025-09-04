const express = require('express');
const router = express.Router();

// مثال: بازگرداندن دستور ساده برای دستگاه خاص
router.get('/commands', (req, res) => {
  // نمونه خروجی: این رو میشه از دیتابیس گرفت یا براساس وضعیت کاربر
  res.send("lamp_func(7,1)");
});

// دریافت مقدار دما از آردوینو
router.post('/lm35', (req, res) => {
  const temperature = req.body.temp;
  console.log("📡 دمای دریافت‌شده:", temperature);

  // اینجا می‌تونی در دیتابیس ذخیره کنی یا ارسال کنی به کلاینت (مثلاً از طریق Socket.io)

  res.sendStatus(200);
});

router.post('/data', async (req, res) => {
  const { mac, type, data } = req.body;

  try {
    // مثلاً ذخیره یا انتشار برای داشبورد
    io.emit('sensor-data', { mac, type, data });

    res.json({ success: true, message: 'داده دریافت شد' });
  } catch (err) {
    console.error('خطا در دریافت داده سنسور:', err);
    res.status(500).json({ success: false });
  }
});


module.exports = router;
