const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'توکن احراز هویت وجود ندارد.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // اطلاعات کاربر در دسترس بقیه روت‌ها قرار می‌گیره
    next();
  } catch (error) {
    res.status(401).json({ message: 'توکن نامعتبر است.' });
  }
};

module.exports = authenticate;
