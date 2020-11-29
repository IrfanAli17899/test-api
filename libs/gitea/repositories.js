const { objectUtils: { omitUndefined } } = require('../../helpers');
const giteaAxios = require('./axios');

const updateRepository = async ({
  owner,
  repository,
  name,
  description,
}) => {
  const { data } = await giteaAxios.patch(
    `/repos/${owner}/${repository}`,
    omitUndefined({ name, description }),
  );

  return {
    id: data.id,
    owner: data.owner.login,
    name: data.name,
    description: data.description,
  };
};

const transferRepositoryOwnership = async ({ owner, repository, new_owner }) => {
  const { data } = await giteaAxios.post(
    `/repos/${owner}/${repository}/transfer`,
    { new_owner },
  );

  return { new_owner: data.new_owner };
};

const forkRepository = async ({ owner, repository, new_owner }) => {
  const { data } = await giteaAxios.post(
    `/repos/${owner}/${repository}/forks`,
    { organization: new_owner },
  );

  return {
    id: data.id,
    owner: data.owner.login,
    name: data.name,
    description: data.description,
  };
};

const readFileFromRepository = async ({ owner, repository, filepath }) => {
  const { data } = await giteaAxios.get(
    `/repos/${owner}/${repository}/contents/${filepath}`,
  );

  return `${Buffer.from(data.content, data.encoding)}`;
};

module.exports = {
  update: updateRepository,
  transfer: transferRepositoryOwnership,
  fork: forkRepository,
  readFile: readFileFromRepository,
};
