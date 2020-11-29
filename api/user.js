const { SHA256 } = require('crypto-js');
const jwt = require('jsonwebtoken');
const {
  USER_QUERIES: {
    CREATE_USER,
    GET_USER,
    GET_TOKEN,
    UPDATE_USER,
  },
} = require('../libs/queries/index');
const { PASSWORD_SALT, TOKEN_SALT } = require('../config');
const { GQLClient } = require('../libs');
const { ApiError } = require('../helpers');

const createPasswordHash = (pass) => SHA256(pass.toString() + PASSWORD_SALT).toString();

const createUser = async (req, res, next) => {
  try {
    const { password, email, username } = req.body;
    if (!email || !password || !username) {
      throw new ApiError(400, 'Please provide valid credentials');
    }
    const data = await GQLClient.mutate({
      mutation: CREATE_USER,
      variables: {
        email,
        username,
        password: createPasswordHash(password),
      },
    });
    res.send({ success: true, data: data.insert_user_one });
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { user } = await GQLClient.query({
      query: GET_USER,
      variables: {
        auth_id: req.user.sub,
      },
    });
    res.send({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const {
      body: {
        about_me, name, birth_date, address, city, country, postal_code,
      },
      user: { sub },
    } = req;
    if (!(
      about_me || name || address || city || birth_date || country || postal_code
    )) throw new ApiError(400, 'There has to be at least one field');
    const { user: [user] } = await GQLClient.query({
      query: GET_USER,
      variables: {
        auth_id: sub,
      },
    });
    if (!user) throw new ApiError(400, 'No user found with provided credentials');
    const { update_user } = await GQLClient.mutate({
      mutation: UPDATE_USER({
        about_me,
        name,
        birth_date,
        address,
        city,
        country,
        postal_code,
      }),
      variables: {
        auth_id: sub,
        about_me,
        name,
        birth_date,
        address,
        city,
        country,
        postal_code,
      },
    });
    res.send({ success: true, data: update_user });
  } catch (error) {
    next(error);
  }
};

const getUserByUsername = async (req, res, next) => {
  try {
    const { username } = req.params;
    if (!username) throw new ApiError(400, 'Please provide valid credentials');
    const data = await GQLClient.query({
      query: GET_USER,
      variables: {
        username,
      },
    });
    const user = data.user[0];
    if (!user) {
      throw new ApiError(404, 'No User Found!!!');
    }
    res.send({
      success: true,
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

function createToken(user, email, username) {
  return jwt.sign({ user, email, username }, TOKEN_SALT);
}

async function checkUserToken(req, _res, next) {
  try {
    let clientToken = req.headers.authorization;
    if (!clientToken) {
      throw new ApiError(500, 'Error in finding user by token');
    }
    clientToken = clientToken.replace('Bearer ', '');
    const { token: tokenArr } = await GQLClient.query({
      query: GET_TOKEN,
      variables: {
        token: clientToken,
      },
    });
    const token = tokenArr[0];
    if (!token) {
      throw new ApiError(500, 'Error in finding user by token');
    }
    req.user = token.user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateUser,
  createUser,
  getUser,
  getUserByUsername,
  checkUserToken,
};
