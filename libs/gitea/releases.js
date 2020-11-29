const { objectUtils: { omitUndefined } } = require('../../helpers');
const giteaAxios = require('./axios');

const convertResponse = (releaseObj) => ({
  id: releaseObj.id,
  tag: releaseObj.tag_name,
  title: releaseObj.name,
  note: releaseObj.body,
  is_prerelease: releaseObj.prerelease,
  is_draft: releaseObj.draft,
  target_commit: releaseObj.target_commitish,
});

const getReleaseById = async ({ owner, repository, id }) => {
  const response = await giteaAxios.get(
    `/repos/${owner}/${repository}/releases/${id}`,
  );

  return convertResponse(response.data);
};

const getReleaseByTag = async ({ owner, repository, tag }) => {
  const response = await giteaAxios.get(
    `/repos/${owner}/${repository}/releases/tags/${tag}`,
  );

  return convertResponse(response.data);
};

const listReleases = async ({ owner, repository, pagination: { limit = 0, page = 0 } }) => {
  const response = await giteaAxios.get(
    `/repos/${owner}/${repository}/releases`,
    { params: { limit, page } },
  );

  return convertResponse(response.data.map(convertResponse));
};

const deleteRelease = async ({ owner, repository, id }) => {
  await giteaAxios.get(
    `/repos/${owner}/${repository}/releases/${id}`,
  );

  return null;
};

const createRelease = async ({
  owner,
  repository,
  tag,
  title,
  note,
  is_prerelease,
  is_draft,
  target_commit,
}) => {
  const response = await giteaAxios.post(
    `/repos/${owner}/${repository}/releases`,
    omitUndefined({
      tag_name: tag,
      target_commitish: target_commit,
      name: title,
      body: note,
      prerelease: is_prerelease,
      draft: is_draft,
    }),
  );

  return convertResponse(response.data);
};

const updateRelease = async ({
  owner,
  repository,
  release_id,
  tag,
  title,
  note,
  is_prerelease,
  is_draft,
  target_commit,
}) => {
  const response = await giteaAxios.patch(
    `/repos/${owner}/${repository}/releases/${release_id}`,
    omitUndefined({
      tag_name: tag,
      name: title,
      body: note,
      prerelease: is_prerelease,
      draft: is_draft,
      target_commitish: target_commit,
    }),
  );

  return convertResponse(response.data);
};

module.exports = {
  getById: getReleaseById,
  getByTag: getReleaseByTag,
  list: listReleases,
  create: createRelease,
  update: updateRelease,
  delete: deleteRelease,
};
