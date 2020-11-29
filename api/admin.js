const { GQLClient, gitea, k8Client } = require('../libs');
const {
  ADMIN_QUERIES: {
    DELETE_ALL_SPACES,
  },
} = require('../libs/queries');

const deleteAllSpaces = async (req, res, next) => {
  try {
    const {
      delete_space: { returning },
    } = await GQLClient.mutate({
      mutation: DELETE_ALL_SPACES,
    });
    returning.forEach((space) => {
      k8Client.deleteNamespace(space.k8_namespace);
      gitea.deleteOrg(space.organization_name);
    });
    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteAllSpaces,
};
