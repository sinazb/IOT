const Device = require('../models/Device');

const addDevice = async (req, res) => {
  try {
    const { deviceType, name, pins } = req.body;

    if (!deviceType || !name || !pins || !Array.isArray(pins)) {
      return res.status(400).json({ message: 'تمام فیلدها باید پر شوند.' });
    }

    const newDevice = new Device({
      userId: req.user.userId,
      deviceType,
      name,
      pins
    });

    await newDevice.save();

    res.status(201).json({ message: 'دستگاه با موفقیت اضافه شد.', device: newDevice });
  } catch (error) {
    res.status(500).json({ message: 'خطا در افزودن دستگاه.', error });
  }
};

const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.userId });
    res.status(200).json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'خطا در دریافت دستگاه‌ها.', error });
  }
};


const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
      });

    if (!device) {
      return res.status(404).json({ message: 'دستگاه یافت نشد' });
    }

    res.status(200).json({ message: 'دستگاه حذف شد' });
  } catch (err) {
    console.error('Delete Device Error:', err);
    res.status(500).json({ message: 'خطا در حذف دستگاه' });
  }
};


exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!device) {
      return res.status(404).json({ message: 'دستگاه یافت نشد' });
    }

    res.status(200).json({ message: 'دستگاه حذف شد' });
  } catch (err) {
    console.error('Delete Device Error:', err);
    res.status(500).json({ message: 'خطا در حذف دستگاه' });
  }
};

module.exports = { addDevice, getDevices, deleteDevice };
