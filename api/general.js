// const { ApiError } = require("../helpers");

const translations = (req, res, next) => {
  try {
    res.send({
      title: 'title',
      description: 'description',
      dummy_text: 'some dummy text',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  translations,
};
