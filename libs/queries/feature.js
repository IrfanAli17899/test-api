const { gql } = require('apollo-boost');

const CREATE_FEATURE_IN_FEATURE_LIST = gql`
  mutation(
    $name: String!
    $repo_name: String!
    $provider: String!
    $key: String!
    $icon: String
    $api_keys: String!
  ) {
    insert_features_one(
      object: {
        name: $name
        icon: $icon
        repo_name: $repo_name
        provider: $provider
        key: $key
        api_keys: $api_keys
      }
    ) {
      id
      name
    }
  }
`;

const GET_FEATURES_FROM_FEATURE_LIST = gql`
  query features($id: uuid) {
    features(where: { id: { _eq: $id } }) {
      id
      name
      repo_name
      icon
      api_keys
      key
    }
  }
`;

const GET_PUBLIC_FEATURES_FROM_FEATURE_LIST = gql`
  query features($ilike: String) {
    features(where: {lock: {_eq: false}, name: {_ilike: $ilike}}) {
      id
      name
      repo_name
      icon
      api_keys
      key
    }
  }
`;

const ADD_TAG = gql`
  mutation add_tag($id: uuid!, $tags: jsonb!) {
    update_features_by_pk(pk_columns: {id: $id}, _append: {tags: $tags}){
      tags
    }
  }
`;

const DELETE_TAG = gql`
  mutation delete_tag($id: uuid!, $tags: String!) {
    update_features_by_pk(pk_columns: {id: $id}, _delete_key: {tags: $tags}) {
      tags
    }
  }
`;

const GET_FEATURES_BY_IDS_IN = gql`
  query get_features_by_ids_in($in: [uuid!] = []) {
    features(where: {id: {_in: $in}}) {
      id
      name
    }
  }
`;

module.exports = {
  CREATE_FEATURE_IN_FEATURE_LIST,
  GET_FEATURES_FROM_FEATURE_LIST,
  ADD_TAG,
  DELETE_TAG,
  GET_PUBLIC_FEATURES_FROM_FEATURE_LIST,
  GET_FEATURES_BY_IDS_IN,
};
