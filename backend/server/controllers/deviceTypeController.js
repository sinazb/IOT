const deviceTypes = require('../constants/deviceTypes');

const getDeviceTypes = (req, res) => {
  res.status(200).json({ deviceTypes });
};

module.exports = { getDeviceTypes };
