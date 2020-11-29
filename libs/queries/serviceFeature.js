const { gql } = require('apollo-boost');

const GET_FEATURE_OF_SERVICE = gql`
  query service_feature_map($id: uuid, $feature_id: uuid!, $service_id: uuid!) {
    service_feature_map(
      where: {
        id: { _eq: $id }
        feature_id: { _eq: $feature_id }
        service_id: { _eq: $service_id }
      }
    ) {
      feature {
        api_keys
        provider
        key
        name
      }
      service {
        space_id
        title
        id
      }
    }
  }
`;

const GET_SPECIFIC_FEATURE_OF_SERVICE = gql`
  query service_feature_map($id: uuid, $feature_id: uuid, $service_id: uuid) {
    service_feature_map(
      where: {
        id: { _eq: $id }
        feature_id: { _eq: $feature_id }
        service_id: { _eq: $service_id }
      }
    ) {
      id
      feature {
        id
        provider
        key
        name
      }
    }
  }
`;

const GET_FEATURE_SERVICE_IDS_IN = gql`
  query get_feature_service_ids_in($in: [uuid!] = []) {
    service_feature_map(where: {id: {_in: $in}}) {
      id
      feature {
        name
        id
      }
      service {
        id
        title
      }
    }
  }
`;

const ADD_FEATURE_IN_SERVICE = gql`
  mutation add_feature_in_service($feature_id: uuid!, $service_id: uuid!) {
    insert_service_feature_map_one(
      object: { feature_id: $feature_id, service_id: $service_id }
    ) {
      id
    }
  }
`;

const DELETE_FEATURE_FROM_SERVICE = gql`
  mutation delete_feature_from_service($service_id: uuid!, $feature_id: uuid!) {
    delete_service_feature_map(where: {service_id: {_eq: $service_id}, feature_id: {_eq: $feature_id}}) {
      returning {
        id
      }
    }
  }
`;

module.exports = {
  GET_FEATURE_SERVICE_IDS_IN,
  ADD_FEATURE_IN_SERVICE,
  GET_FEATURE_OF_SERVICE,
  DELETE_FEATURE_FROM_SERVICE,
  GET_SPECIFIC_FEATURE_OF_SERVICE,
};
