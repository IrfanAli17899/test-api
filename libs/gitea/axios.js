const { default: axios } = require('axios');

const { GITEA_BASE_URL, GITEA_ACCESS_TOKEN } = require('../../config');

module.exports = axios.create({
  baseURL: GITEA_BASE_URL,
  params: {
    access_token: GITEA_ACCESS_TOKEN,
  },
});
