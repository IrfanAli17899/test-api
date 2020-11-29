const { gitea } = require('../libs');
const { ApiError } = require('../helpers');

// provides all gitea users;
const getAllUsers = async (req, res, next) => {
  try {
    const { data } = await gitea.getAllUsers();
    res.send({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// creates a gitea user;
const createUser = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      throw new ApiError(400, 'Please Provide Valid Data !!!');
    }
    const { data } = await gitea.createUser({ email, password, username });
    res.send({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  createUser,
};
