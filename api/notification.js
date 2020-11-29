const { ApiError } = require('../helpers');
const { GQLClient } = require('../libs');
const {
  NOTIFICATION_QUERIES: {
    GET_NOTIFICATIONS,
    TRACK_SERVICE,
    UNTRACK_SERVICE,
  },
  TEAM_QUERIES: {
    GET_ASSIGNMENTS,
  },
  SERVICE_QUERIES: {
    GET_SERVICES,
  },
  // USER_QUERIES: {
  //   GET_USER,
  // }
} = require('../libs/queries');

const getUsersNotifications = async (req, res, next) => {
  try {
    const { sub } = req.user;
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
      },
    });
    const { notification } = await GQLClient.query({
      query: GET_NOTIFICATIONS,
      variables: {
        user_auth_id: sub,
        service_ids: service.map((item) => item.id),
      },
    });
    res.send({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    const { user: { sub }, body: { service_id } } = req;
    if (!service_id) throw new ApiError('Provide service id');
    await GQLClient.mutate({
      mutation: UNTRACK_SERVICE,
      variables: {
        user_auth_id: sub,
        service_id,
      },
    });
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

const subscribe = async (req, res, next) => {
  try {
    const { user: { sub }, body: { service_id } } = req;
    if (!service_id) throw new ApiError('Provide service id');
    await GQLClient.mutate({
      mutation: TRACK_SERVICE,
      variables: {
        user_auth_id: sub,
        service_id,
      },
    });
    res.send({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsersNotifications,
  unsubscribe,
  subscribe,
};
