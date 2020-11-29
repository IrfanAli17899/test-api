const {
  SPACE_QUERIES: {
    GET_SPACES,
    CREATE_SPACE,
    DELETE_SPACE,
    SELECT_CONNECTOR,
    ADD_CONNECTOR,
    DELETE_CONNECTOR,
    ADD_TAG,
    DELETE_TAG,
  },
  TEAM_QUERIES: {
    GET_ASSIGNMENTS,
    AccessLevels,
  },
} = require('../libs/queries/index');

const {
  GQLClient, gitea, k8Client, secretClient,
} = require('../libs');
const { ApiError } = require('../helpers');
const { spaceValidator } = require('../helpers/validators');

const getSpaces = async (req, res, next) => {
  try {
    const {
      body: { namespace },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { space } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        namespace,
        assignments,
      },
    });
    if (namespace && !space[0]) throw new ApiError(404, 'No such space');
    res.send({ success: true, data: space });
  } catch (error) {
    next(error);
  }
};
const {
  TEAM_QUERIES: {
    CREATE_TEAM,
  },
} = require('../libs/queries/index');

const createTeam = async (space_id, sub) => {
  const { space: [space] } = await GQLClient.query({
    query: GET_SPACES,
    variables: {
      id: space_id,
      user_auth_id: sub,
    },
  });
  if (!space) throw new ApiError(400, 'No such space');
  const { insert_team: { returning: [insert_team] } } = await GQLClient.mutate({
    mutation: CREATE_TEAM,
    variables: {
      space_id,
      title: space_id,
    },
  });
  return insert_team;
};

const createSpace = async (req, res, next) => {
  try {
    const {
      body: { name, description },
      user,
    } = req;
    const validate = spaceValidator.createSpace.validate(
      { name, description },
      { abortEarly: false },
    );
    if (validate.error) {
      throw new ApiError(
        400,
        `Please provide valid fields, ${validate.error}`,
      );
    }
    const randomizedName = `${name.toLowerCase()}-${Math.floor(
      100000 + Math.random() * 900000,
    )}`.replace(/ /g, '-');
    const { data } = await gitea.createOrg({
      name: randomizedName,
      description,
    });
    console.log(data);
    const { k8_namespace_uid, k8_namespace } = await k8Client.createNamespace(
      randomizedName,
    );
    console.log(k8_namespace_uid, k8_namespace);
    const { insert_space_one } = await GQLClient.mutate({
      mutation: CREATE_SPACE,
      variables: {
        user_auth_id: user.sub,
        description,
        title: name,
        k8_namespace_uid,
        k8_namespace,
        organization: data.id,
        organization_name: data.username,
      },
    });
    await createTeam(insert_space_one.id, user.sub);
    res.send({ success: true, data: insert_space_one });
  } catch (error) {
    next(error);
  }
};

const deleteSpace = async (req, res, next) => {
  try {
    const {
      body: { id },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { space } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        assignments,
      },
    });
    if (!space[0]) throw new ApiError(403, 'You are not allowed to delete this space');
    const { delete_space_by_pk } = await GQLClient.mutate({
      mutation: DELETE_SPACE,
      variables: {
        id,
      },
    });
    try {
      if (delete_space_by_pk) {
        k8Client.deleteNamespace(delete_space_by_pk.k8_namespace);
        gitea.deleteOrg(delete_space_by_pk.organization_name);
      }
    } catch (_error) {}
    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const addConnector = async (req, res, next) => {
  try {
    const {
      body: { key, value, space_id },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { space: [space] } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        id: space_id,
        assignments,
        user_auth_id: sub,
      },
    });
    if (!space) throw new ApiError(403, 'You are not allowed to change this space');
    const randomize = `${key}_${space_id}`;
    await secretClient.createKey(randomize);
    await secretClient.addSecretVersion(randomize, value);

    const { insert_connector_one } = await GQLClient.mutate({
      mutation: ADD_CONNECTOR,
      variables: {
        key,
        space_id,
      },
    });
    res.send({ success: true, data: insert_connector_one });
  } catch (error) {
    next(error);
  }
};

const deleteConnector = async (req, res, next) => {
  try {
    const {
      body: { id },
    } = req;
    const { sub } = req.user;
    const { connector_by_pk } = await GQLClient.query({
      query: SELECT_CONNECTOR,
      variables: {
        id,
      },
    });
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: 1,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { space: [space] } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        assignments,
        space_id: connector_by_pk.space_id,
      },
    });
    if (!space) throw new ApiError(403, 'You are not allowed to change this space');
    const { delete_connector_by_pk } = await GQLClient.mutate({
      mutation: DELETE_CONNECTOR,
      variables: {
        id,
      },
    });
    console.log('delete_connector_by_pk========>>', delete_connector_by_pk);
    if (delete_connector_by_pk) {
      secretClient.deleteKey(
        `${delete_connector_by_pk.key}_${delete_connector_by_pk.space_id}`,
      );
    }
    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const addTag = async (req, res, next) => {
  try {
    const {
      body: { id, tags },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { space } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        assignments,
      },
    });
    if (!space[0]) throw new ApiError(403, 'You are not allowed to change this space');
    const { update_space_by_pk } = await GQLClient.mutate({
      mutation: ADD_TAG,
      variables: {
        id,
        tags,
      },
    });
    res.send({ success: true, data: update_space_by_pk });
  } catch (error) {
    next(error);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const {
      body: { id, tags },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { space } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        assignments,
      },
    });
    if (!space[0]) throw new ApiError(403, 'You are not allowed to change this space');
    const { update_space_by_pk } = await GQLClient.mutate({
      mutation: DELETE_TAG,
      variables: {
        id,
        tags,
      },
    });
    res.send({ success: true, data: update_space_by_pk });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSpaces,
  createSpace,
  deleteSpace,
  addConnector,
  deleteConnector,
  addTag,
  deleteTag,
};
