const fonts = require('./fonts');
const dimensions = require('./dimensions');
const general = require('./colors');
const prosper = require('./colors-prosper');
const s3 = require('./s3');

const constants = {
  fonts,
  dimensions,
  colors: {
    general,
    prosper,
  },
  s3,
};

module.exports = { constants };
