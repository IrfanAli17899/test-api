const { gql } = require('apollo-boost');

const INSERT_NOTIFICATION = gql`
  mutation insert_notification($body: String, $service_id: uuid!) {
    insert_notification(objects: {service_id: $service_id, body: $body}) {
      returning {
        body
        id
        created
        service_id
      }
    }
  }
`;

const GET_NOTIFICATIONS = gql`
  query get_notifications($user_auth_id: String!, $service_ids: [uuid!] = []) {
    notification(where: {
      service: {tracked_services: {user_auth_id: {_eq: $user_auth_id}}}, service_id: {_in: $service_ids}}) {
      body
      service_id
      service {
        title
      }
    }
  }
`;

const DELETE_NOTIFICATIONS = gql`
  mutation delete_notifications($now: timestamptz!) {
    delete_notification(where: {created: {_lt: $now}}) {
      affected_rows
    }
  }
`;

const TRACK_SERVICE = gql`
  mutation add_to_tracked_services($service_id: uuid!, $user_auth_id: String!) {
    insert_tracked_services_one(object: {service_id: $service_id, user_auth_id: $user_auth_id}) {
      user_auth_id
      service_id
    }
  }
`;

const UNTRACK_SERVICE = gql`
mutation remove_from_tracked_services($service_id: uuid!, $user_auth_id: String!) {
  delete_tracked_services(where: {service_id: {_eq: $service_id}, user_auth_id: {_eq: $user_auth_id}}) {
    returning {
      user_auth_id
      service_id
    }
  }
}
`;

module.exports = {
  DELETE_NOTIFICATIONS,
  INSERT_NOTIFICATION,
  GET_NOTIFICATIONS,
  TRACK_SERVICE,
  UNTRACK_SERVICE,
};
