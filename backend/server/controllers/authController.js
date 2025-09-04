const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { username, password, arduinoIP, arduinoMAC } = req.body;

    // چک کردن فیلدها
    if (!username || !password || !arduinoIP || !arduinoMAC) {
      return res.status(400).json({ message: 'تمام فیلدها الزامی هستند.' });
    }

    // بررسی کاربر تکراری
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'نام کاربری قبلاً ثبت شده.' });
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      arduinoIP,
      arduinoMAC,
    });

    await newUser.save();

    res.status(201).json({ message: 'ثبت‌نام موفق بود.' });
  } catch (error) {
    res.status(500).json({ message: 'خطا در ثبت‌نام.', error });
  }
};


const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // بررسی فیلدها
    if (!username || !password) {
      return res.status(400).json({ message: 'نام کاربری و رمز عبور الزامی است.' });
    }

    // پیدا کردن کاربر
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'کاربر یافت نشد.' });
    }

    // بررسی رمز
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'رمز عبور اشتباه است.' });
    }

    // تولید توکن
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'ورود موفقیت‌آمیز بود.',
      token,
      user: {
        id: user._id,
        username: user.username,
        arduinoIP: user.arduinoIP,
        arduinoMAC: user.arduinoMAC,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'خطا در ورود.', error });
  }
};

module.exports = { register, login };
