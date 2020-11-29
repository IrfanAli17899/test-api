const child_process = require('child_process');
const { SHA256 } = require('crypto-js');
const { ApiError } = require('../helpers');
const {
  CLIENT_ID,
  CLIENT_SECRET,
  AUTH_API_URL,
  AUDIENCE,
  DEBUG,
} = require('../config');
// const {
//   USER_QUERIES: { CREATE_USER_TOKEN, GET_USER, CREATE_USER },
// } = require("../libs/queries/index");
const { PASSWORD_SALT } = require('../config');
const { GQLClient } = require('../libs');
const { authValidator } = require('../helpers/validators');

function createPasswordHash(pass) {
  return SHA256(pass.toString() + PASSWORD_SALT).toString();
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // const options = {
    //   method: 'POST',
    //   url: `https://${AUTH_API_URL}/oauth/token`,
    //   data: {
    //     audience: AUDIENCE,
    //     grant_type: "password",
    //     username: email,
    //     password,
    //     client_id: CLIENT_ID,
    //     client_secret: CLIENT_SECRET,
    //     scope: "login"
    //   },
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    // };
    // const res = await axios.request(options);
    if (!email || !password) {
      throw new ApiError(400, 'Please provide valid credentials');
    }
    console.log(email, password);
    const resp = child_process
      .execSync(
        `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "client_id=${CLIENT_ID}" \
        --data-urlencode "grant_type=password" \
        --data-urlencode "username=${email}" \
        --data-urlencode "password=${password}" \
        --data-urlencode "audience=${AUDIENCE}" \
        --data-urlencode "client_secret=${CLIENT_SECRET}" \
        https://${AUTH_API_URL}/oauth/token`,
      )
      .toString();
    const resJson = JSON.parse(resp);
    console.log(resJson);
    if (!resp || !resJson.access_token) throw new ApiError(400, resJson.error_description);
    // const data = await GQLClient.query({
    //   query: GET_USER,
    //   variables: {
    //     email,
    //     // password: createPasswordHash(password),
    //   },
    // });
    // const user = data.user[0];

    // if (!user) {
    //   throw new ApiError(400, "Please provide valid credentials");
    // }
    // await GQLClient.mutate({
    //   mutation: CREATE_USER_TOKEN,
    //   variables: {
    //     user_id: user.id,
    //     token: resJson.access_token,
    //   },
    // });
    res.send({ success: true, data: { token: resJson.access_token, email } });
  } catch (err) {
    next(err);
  }
};

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const validate = authValidator.login.validate(
      { email, password },
      { abortEarly: false },
    );
    if (validate.error) {
      throw new ApiError(
        400,
        `${validate.error}`,
      );
    }
    const resp = child_process
      .execSync(
        `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" \
        --data-urlencode "client_id=${CLIENT_ID}" \
        --data-urlencode "email=${email}" \
        --data-urlencode "password=${password}" \
        --data-urlencode "connection=Username-Password-Authentication" \
        https://${AUTH_API_URL}/dbconnections/signup`,
      )
      .toString();
    const resJson = JSON.parse(resp);
    console.log(resJson);
    if (!resp || !resJson.email) throw new ApiError(400, 'Email Address Already Exists !!');
    // await GQLClient.mutate({
    //   mutation: CREATE_USER,
    //   variables: {
    //     email,
    //     username: email,
    //     password: createPasswordHash(password),
    //   },
    // });
    res.send({ success: true, data: resJson.email });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  signup,
};
