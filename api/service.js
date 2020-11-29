const { v4: uuid } = require('uuid');
const { GoogleAuth } = require('google-auth-library');

const {
  DEPLOYMENT_BASE_DOMAIN,
  GITEA_BASE_URL,
  PROJECT_ID,
} = require('../config');

const {
  SPACE_QUERIES: { GET_SPACES },
  TEAM_QUERIES: { GET_ASSIGNMENTS, AccessLevels },
  SERVICE_QUERIES: {
    GET_SERVICES,
    CREATE_SERVICE,
    DELETE_SERVICE,
    UPDATE_SERVICE,
    STAR_SERVICE,
    UNSTAR_SERVICE,
    ADD_TAG,
    DELETE_TAG,
    GET_STARRED,
  },
} = require('../libs/queries');

const {
  pubsub: {
    createTopic,
    createSubscription,
    deleteTopic,
  },
} = require('../libs');

const {
  gitea,
  GQLClient,
  secretClient,
  k8Client: { deleteDeployment },
} = require('../libs');

const { ApiError, random: { randRange } } = require('../helpers');
const { serviceValidator } = require('../helpers/validators');
const { createSSHPair } = require('../libs/ssh');
const { updateDraftServiceVersion } = require('./serviceVersion');

const auth = new GoogleAuth({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });

const fetch = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      throw new ApiError(400, 'Provide id via query');
    }

    const client = await auth.getClient();
    const response = await client.request({
      url: `https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/builds/${id}`,
    });

    res.send({ succes: true, data: response.data.status });
  } catch (err) {
    next(err);
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
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        assignments_service:
        user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.service_id),
        assignments_space: user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id),
        user_auth_id: sub,
        id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_service_by_pk } = await GQLClient.mutate({
      mutation: ADD_TAG,
      variables: {
        id,
        tags,
      },
    });
    res.send({ success: true, data: update_service_by_pk });
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
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        assignments_service:
        user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.service_id),
        assignments_space: user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id),
        user_auth_id: sub,
        id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_service_by_pk } = await GQLClient.mutate({
      mutation: DELETE_TAG,
      variables: {
        id,
        tags,
      },
    });
    res.send({ success: true, data: update_service_by_pk });
  } catch (error) {
    next(error);
  }
};

const getAllServices = async (req, res, next) => {
  try {
    const { body: { space_id } = {}, user: { sub } } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
      },
    });
    let assignments_service;
    let assignments_space;
    if (user_team_map.length) {
      assignments_service = user_team_map
        .flatMap((map) => map.assignments)
        .flatMap((item) => item.service_id);

      assignments_space = user_team_map
        .flatMap((map) => map.team)
        .flatMap((team) => team.space_id);
    }
    const { service } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        user_auth_id: sub,
        assignments_service,
        assignments_space,
        space_id,
      },
    });
    let { user_favourite_map } = await GQLClient.query({
      query: GET_STARRED,
      variables: {
        user_auth_id: sub,
      },
    });
    user_favourite_map = user_favourite_map.map((item) => item.service_id);
    service.forEach((item) => {
      // eslint-disable-next-line no-param-reassign
      if (user_favourite_map.includes(item.id)) item.star = true;
    });
    res.send({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const genarateServiceNames = (orgName, appName) => {
  const randomizedName = `${appName}-${randRange(100000, 999999)}`
    .toLowerCase()
    .replace(/\s/g, '-');

  return {
    randomizedName,
    sshKeyTitle: `${orgName}-${randomizedName}`,
    appId: uuid(),
    url: `${randomizedName}.${DEPLOYMENT_BASE_DOMAIN}`,
  };
};

const createService = async (req, res, next) => {
  try {
    const {
      body: {
        space_id,
        name,
        description,
        // clone_addr,
        service = 'git',
        color_schema = 1,
      },
      user: { sub },
    } = req;

    const { error: validationError } = serviceValidator.createService.validate({
      space_id,
      name,
      description,
      // clone_addr,
      service,
    });

    if (validationError) {
      throw new ApiError(400, validationError.message);
    }

    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });

    const assignments = !user_team_map.length
      ? null
      : user_team_map
        .flatMap((map) => map.team)
        .flatMap((team) => team.space_id);

    const { space: [space] } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        id: space_id,
        user_auth_id: sub,
        assignments,
      },
    });

    if (!space) {
      throw new ApiError(404, 'Space not found');
    }

    if (
      !space.user_auth_id === sub
      && !user_team_map
        .flatMap((map) => map.team)
        .flatMap((team) => team.space_id)
        .includes(space.id)
    ) {
      throw new ApiError(403, 'You are not allowed to create service in this space');
    }

    const {
      randomizedName, appId, sshKeyTitle, url,
    } = genarateServiceNames(space.organization_name, name);

    const { data } = await gitea.repoMigrate({
      clone_addr: `${GITEA_BASE_URL.replace('/api/v1', '')}/root/template`,
      repo_name: randomizedName,
      UID: space.organization,
      description,
      service,
    });

    const config_json = {
      common: {
        title: name,
        description,
        color_schema,
        app_id: appId,
      },
      features: [],
    };

    await gitea.updateRepoFile({
      repo_owner: space.organization_name,
      repo_name: randomizedName,
      content: JSON.stringify(config_json),
      message: 'config.json file updated',
      path: 'src/config.json',
    });

    const sshKey = await createSSHPair('');
    await secretClient.createKey(sshKeyTitle);
    await secretClient.addSecretVersion(sshKeyTitle, sshKey.key);

    await gitea.putNewKeyToRepo(
      randomizedName,
      space.organization_name,
      sshKeyTitle,
      sshKey.pubKey,
    );
    await createTopic(randomizedName);
    await createSubscription(randomizedName, randomizedName);

    const { new_service } = await GQLClient.mutate({
      mutation: CREATE_SERVICE,
      variables: {
        id: appId,
        title: name,
        space_id,
        user_auth_id: sub,
        repo: data.id,
        repo_name: randomizedName,
        url,
        description,
      },
    });

    const { service: [newService] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: { id: appId, user_auth_id: sub },
    });

    await updateDraftServiceVersion(newService);

    res.send({ success: true, data: new_service });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
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
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        assignments_service: user_team_map
          .flatMap((map) => map.assignments)
          .flatMap((assignment) => assignment.service_id),
        assignments_space: user_team_map
          .flatMap((map) => map.team)
          .flatMap((team) => team.space_id),
        user_auth_id: sub,
        id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { repo_name, space: { organization_name } } = service;
    deleteTopic(repo_name);
    gitea.deleteRepo(organization_name, repo_name);
    await deleteDeployment(repo_name, organization_name);
    await GQLClient.mutate({
      mutation: DELETE_SERVICE,
      variables: {
        id,
      },
    });
    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const repoMigrate = async (req, res, next) => {
  try {
    const {
      clone_addr,
      repo_name,
      repo_owner,
      description,
      service,
    } = req.body;
    const { data } = await gitea.repoMigrate({
      clone_addr,
      repo_name,
      repo_owner,
      description,
      service,
    });
    return { success: true, data };
  } catch (error) {
    return next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const {
      id, play, lock,
    } = req.body;
    const { sub } = req.user;
    if (!id) throw new ApiError(400, 'Provide valid fields');
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
      },
    });
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        assignments_service:
        user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.service_id),
        user_auth_id: sub,
        id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_service } = await GQLClient.mutate({
      mutation: UPDATE_SERVICE({ play, lock }),
      variables: {
        id, play, lock,
      },
    });
    res.send({ success: true, data: update_service });
  } catch (error) {
    next(error);
  }
};

const starService = async (req, res, next) => {
  try {
    const {
      body: { id },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
      },
    });
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        assignments_service:
        user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.service_id),
        user_auth_id: sub,
        id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_service_by_pk } = await GQLClient.mutate({
      mutation: STAR_SERVICE,
      variables: {
        user_auth_id: sub,
        service_id: id,
      },
    });
    res.send({ success: true, data: update_service_by_pk });
  } catch (error) {
    next(error);
  }
};

const unstarService = async (req, res, next) => {
  try {
    const {
      body: { id },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,

      },
    });
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        assignments_service:
        user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.service_id),
        user_auth_id: sub,
        id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_service_by_pk } = await GQLClient.mutate({
      mutation: UNSTAR_SERVICE,
      variables: {
        user_auth_id: sub,
        service_id: id,
      },
    });
    res.send({ success: true, data: update_service_by_pk });
  } catch (error) {
    next(error);
  }
};

const cloneService = async (req, res, next) => {
  try {
    const {
      error: validationError,
      value: validValue,
    } = serviceValidator.cloneService.validate(req.body);

    if (validationError) {
      throw new ApiError(400, validationError.message);
    }

    const {
      service_id, target_space_id, new_name, new_description,
    } = validValue;

    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: req.user.sub,
        access_level: AccessLevels.ADMIN,
      },
    });

    const assignments = user_team_map
      .flatMap((map) => map.assignments)
      .flatMap((assignment) => assignment.service_id);

    const [{ service: [service] }, { space: [targetSpace] }] = await Promise.all([
      GQLClient.query({
        query: GET_SERVICES,
        variables: {
          assignments_service: assignments,
          user_auth_id: req.user.sub,
          id: service_id,
        },
      }),
      GQLClient.query({
        query: GET_SPACES,
        variables: {
          assignments,
          user_auth_id: req.user.sub,
          id: target_space_id,
        },
      }),
    ]);

    const accessError = null
      || (!service && 'Service not found/Access denied')
      || (!targetSpace && 'Space not found/Access denied');

    if (accessError) {
      throw new ApiError(403, accessError);
    }

    const {
      randomizedName, appId, sshKeyTitle, url,
    } = genarateServiceNames(service.space.organization_name, new_name);

    let newRepo = await gitea.repositories.fork({
      owner: service.space.organization_name,
      repository: service.repo_name,
      new_owner: targetSpace.organization_name,
    });

    newRepo = await gitea.repositories.update({
      owner: newRepo.owner,
      repository: newRepo.name,
      name: randomizedName,
      description: new_description,
    });

    const config_json = JSON.parse(
      await gitea.repositories.readFile({
        owner: newRepo.owner,
        repository: newRepo.name,
        filepath: 'src/config.json',
      }),
    );

    config_json.common.title = new_name;
    config_json.common.description = new_description;
    config_json.common.app_id = appId;

    await gitea.updateRepoFile({
      repo_owner: newRepo.owner,
      repo_name: newRepo.name,
      content: JSON.stringify(config_json),
      message: 'config.json file updated',
      path: 'src/config.json',
    });

    const sshKey = await createSSHPair('');
    await secretClient.createKey(sshKeyTitle);
    await secretClient.addSecretVersion(sshKeyTitle, sshKey.key);

    await gitea.putNewKeyToRepo(
      newRepo.name, newRepo.owner, sshKeyTitle, sshKey.pubKey,
    );

    const { new_service: newService } = await GQLClient.mutate({
      mutation: CREATE_SERVICE,
      variables: {
        id: appId,
        title: new_name,
        space_id: target_space_id,
        user_auth_id: service.user_auth_id,
        repo: newRepo.id,
        repo_name: newRepo.name,
        description: newRepo.description,
        url,
      },
    });

    await updateDraftServiceVersion(newService);

    res.send(newService);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateService,
  createService,
  getAllServices,
  deleteService,
  repoMigrate,
  fetch,
  addTag,
  deleteTag,
  starService,
  unstarService,
  cloneService,
};
