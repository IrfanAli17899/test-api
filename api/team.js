/* eslint-disable max-len */
const _ = require('lodash');
const { ApiError } = require('../helpers');
const { GQLClient } = require('../libs');
const { assignmentValidator } = require('../helpers/validators');
const {
  USER_QUERIES: {
    GET_USER,
  },
  TEAM_QUERIES: {
    UPDATE_TEAM,
    GET_TEAM,
    ADD_USER_TO_TEAM,
    DELETE_MEMBER_FROM_TEAM,
    GET_MEMBERSHIP,
    GET_EXISTING_USER_TEAM_PAIR,
    GET_ASSIGNMENTS,
    AccessLevels,
  },
  SPACE_QUERIES: {
    GET_SPACES,
  },
  SERVICE_FEATURE_QUERIES: {
    GET_SPECIFIC_FEATURE_OF_SERVICE,
    GET_FEATURE_SERVICE_IDS_IN,
  },
  SERVICE_QUERIES: {
    GET_SERVICES,
    GET_SERVICES_BY_ID_IN,
  },
  FEATURE_QUERIES: {
    GET_FEATURES_BY_IDS_IN,
  },
} = require('../libs/queries/index');
const { SET_ASSIGNMENTS, UPDATE_USERS_ROLE } = require('../libs/queries/team');

const getMembership = async (req, res, next) => {
  try {
    const { team_id } = req.query;
    const { sub } = req.user;
    let teamResult;
    if (team_id) {
      const { user_team_map } = await GQLClient.query({
        query: GET_ASSIGNMENTS,
        variables: {
          user_auth_id: sub,
        },
      });
      let assignments;
      if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
      teamResult = await GQLClient.query({
        query: GET_TEAM,
        variables: {
          id: team_id,
          user_auth_id: sub,
          assignments,
        },
      });
    }
    if (team_id && !teamResult.team[0]) throw new ApiError(400, 'You are not the owner of that team');
    const { user_team_map } = await GQLClient.query({
      query: GET_MEMBERSHIP,
      variables: {
        team_id: teamResult && teamResult.team[0].id,
        user_auth_id: sub,
      },
    });
    res.send({ success: true, data: user_team_map });
  } catch (error) {
    next(error);
  }
};

const getUserAssignments = async (req, res, next) => {
  try {
    const { sub } = req.user;
    const { user_team_map } = await GQLClient.query({
      query: GET_MEMBERSHIP,
      variables: {
        user_auth_id: sub,
      },
    });
    const { service } = await GQLClient.query({
      query: GET_SERVICES_BY_ID_IN,
      variables: {
        in: user_team_map.length
          ? user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.service_id) : [],
      },
    });
    const { features } = await GQLClient.query({
      query: GET_FEATURES_BY_IDS_IN,
      variables: {
        in: user_team_map.length
          ? user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.feature_id) : [],
      },
    });
    const { service_feature_map } = await GQLClient.query({
      query: GET_FEATURE_SERVICE_IDS_IN,
      variables: {
        in: user_team_map.length
          ? user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.serv_feat_id) : [],
      },
    });
    const rolesList = { services: [], features: [], serviceFeatures: [] };
    user_team_map.forEach((map) => {
      rolesList.services = rolesList.services.concat(
        map.assignments.service_id.map((item) => Object({
          space: map.team.space.title,
          app: service.find((serv) => serv.id === item).title,
          role: map.access_level,
        })),
      );
      rolesList.features = rolesList.features.concat(
        map.assignments.feature_id.map((item) => Object({
          space: map.team.space.title,
          feature: features.find((feature) => feature.id === item).name,
          role: map.access_level,
        })),
      );
      rolesList.serviceFeatures = rolesList.serviceFeatures.concat(
        map.assignments.serv_feat_id.map((item) => Object({
          space: map.team.space.title,
          serviceFeature: service_feature_map.find((feature) => feature.id === item),
          role: map.access_level,
        })),
      );
    });
    res.send({ success: true, data: rolesList });
  } catch (error) {
    next(error);
  }
};

const getSpecificAssignments = async (req, res, next) => {
  try {
    const { service_id } = req.query;
    if (!service_id) throw new ApiError(400, 'Provide service_id through query');
    const { sub } = req.user;
    let { user_team_map } = await GQLClient.query({
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
        id: service_id,
      },
    });
    if (!service) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { service_feature_map } = await GQLClient.query({
      query: GET_SPECIFIC_FEATURE_OF_SERVICE,
      variables: {
        service_id,
      },
    });
    user_team_map = user_team_map.flatMap((item) => item.assignments).flatMap((item) => item.serv_feat_id);
    let features = service_feature_map.filter((item) => user_team_map.includes(item.id));
    features = features.map((item) => item.feature);
    res.send({ success: true, data: { features } });
  } catch (error) {
    next(error);
  }
};

const getTeamsOnSpace = async (req, res, next) => {
  try {
    const { space_id } = req.query;
    const { sub } = req.user;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
      },
    });
    let assignments;
    if (user_team_map.length) assignments = user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id);
    const { team: [team] } = await GQLClient.query({
      query: GET_TEAM,
      variables: {
        space_id,
        user_auth_id: sub,
        assignments,
      },
    });
    if (!team) throw new ApiError(400, 'You are not assigned to this space');
    res.send({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { user: { sub }, body: { id, access_level } } = req;
    if (!id || !access_level) throw new ApiError(400, 'Provide valid fields');
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    if (!user_team_map.length) throw new ApiError(403, 'You are not allowed to update roles of this space');
    const { space: [space] } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        assignments: user_team_map.flatMap((map) => map.team).flatMap((team) => team.space_id),
      },
    });
    if (!space) throw new ApiError(403, 'You are not allowed to update this space');
    const { update_user_team_map } = await GQLClient.mutate({
      mutation: UPDATE_USERS_ROLE,
      variables: {
        id,
        access_level,
      },
    });
    res.send({ success: true, data: update_user_team_map });
  } catch (error) {
    next(error);
  }
};

const addAssignment = async (req, res, next) => {
  try {
    const { user_team_map_id, requestedAssignments } = req.body;
    const validator = assignmentValidator.assignment.validate(requestedAssignments);
    if (!user_team_map_id || validator.error) {
      throw new ApiError(
        400, `Provide valid fields${validator.error ? ` ${validator.error}` : ''}`,
      );
    }
    const { user_team_map: [item] } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        id: user_team_map_id,
      },
    });
    const { assignments } = item;
    for (const key in assignments) {
      for (const bodyKey in requestedAssignments) {
        if (key === bodyKey) assignments[key] = assignments[key].concat(requestedAssignments[bodyKey]);
      }
    }
    const { update_user_team_map } = await GQLClient.mutate({
      mutation: SET_ASSIGNMENTS,
      variables: {
        id: user_team_map_id,
        assignments,
      },
    });
    // if (!update_team.returning.length) throw new Error(404, 'No such team');
    res.send({ success: true, data: update_user_team_map });
  } catch (error) {
    next(error);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    const { user_team_map_id, requestedAssignments } = req.body;
    const validator = assignmentValidator.assignment.validate(requestedAssignments);
    if (!user_team_map_id || validator.error) {
      throw new ApiError(
        400, `Provide valid fields${validator.error ? ` ${validator.error}` : ''}`,
      );
    }
    const { user_team_map: [item] } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        id: user_team_map_id,
      },
    });
    const { assignments } = item;
    for (const key in assignments) {
      for (const bodyKey in requestedAssignments) {
        if (key === bodyKey) assignments[key] = _.difference(assignments[key], requestedAssignments[key]);
      }
    }
    const { update_user_team_map } = await GQLClient.mutate({
      mutation: SET_ASSIGNMENTS,
      variables: {
        id: user_team_map_id,
        assignments,
      },
    });
    // if (!update_team.returning.length) throw new Error(404, 'No such team');
    res.send({ success: true, data: update_user_team_map });
  } catch (error) {
    next(error);
  }
};

const addUserToTeam = async (req, res, next) => {
  try {
    const { user_auth_id, team_id, access_level } = req.body;
    const { sub } = req.user;
    if (!user_auth_id || !team_id || !access_level) throw new ApiError(400, 'Provide valid fields');
    const { team: [team] } = await GQLClient.query({
      query: GET_TEAM,
      variables: {
        id: team_id,
      },
    });
    if (!team) throw new ApiError(400, 'No such team');
    const { user_team_map: [user_team_map] } = await GQLClient.query({
      query: GET_EXISTING_USER_TEAM_PAIR,
      variables: {
        team_id: team.id,
        user_auth_id,
      },
    });
    if (user_team_map) throw new ApiError(400, 'User already in this team');
    const { user_team_map: userTeamMap } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    let assignments;
    if (userTeamMap.length) assignments = userTeamMap.flatMap((map) => map.team).flatMap((uteam) => uteam.space_id);
    const { space: [space] } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        id: team.space_id,
        assignments,
      },
    });
    if (!space) throw new ApiError(403, 'You are not allowed to change this space');
    const { insert_user_team_map_one } = await GQLClient.mutate({
      mutation: ADD_USER_TO_TEAM,
      variables: {
        team_id: team.id,
        user_auth_id,
        access_level,
      },
    });
    res.send({ success: true, data: insert_user_team_map_one });
  } catch (error) {
    next(error);
  }
};

const deleteUserFromTeam = async (req, res, next) => {
  try {
    const { user_auth_id, team_id } = req.body;
    const { sub } = req.user;
    const { team: [team] } = await GQLClient.query({
      query: GET_TEAM,
      variables: {
        id: team_id,
      },
    });
    if (!team) throw new ApiError(400, 'No such team');
    const { user_team_map: userTeamMap } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    let assignments;
    if (userTeamMap.length) assignments = userTeamMap.map((map) => map.team).map((uteam) => uteam.space_id);
    const { space: [space] } = await GQLClient.query({
      query: GET_SPACES,
      variables: {
        user_auth_id: sub,
        id: team.space_id,
        assignments,
      },
    });
    if (!space) throw new ApiError(403, 'You are not allowed to change this space');
    if (!user_auth_id || !team_id) throw new ApiError(400, 'Provide valid fields');
    const { delete_user_team_map } = await GQLClient.mutate({
      mutation: DELETE_MEMBER_FROM_TEAM,
      variables: {
        team_id,
        user_auth_id,
      },
    });
    if (!delete_user_team_map.returning.length) throw new ApiError(404, 'No such user in this team');
    res.send({ success: true, data: delete_user_team_map });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserAssignments,
  getMembership,
  addAssignment,
  deleteAssignment,
  addUserToTeam,
  deleteUserFromTeam,
  updateRole,
  getTeamsOnSpace,
  getSpecificAssignments,
};
