const giteaAxios = require('./axios');

const getBranch = async ({ owner, repository, branch }) => {
  const response = await giteaAxios(
    `/repos/${owner}/${repository}/branches/${branch}`,
  );

  return ({
    commit: response.data.commit.id,
  });
};

module.exports = {
  get: getBranch,
};
