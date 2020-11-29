const { gql } = require('apollo-boost');

const GET_SPACES = gql`
  query get_spaces($user_auth_id: String = "", $id: uuid, $namespace: String, $assignments: [uuid!] = []) {
    space(
      where: {
        _or: [
          { user_auth_id: { _eq: $user_auth_id } },
          { id: { _in: $assignments } }
        ],
        id: { _eq: $id },
        k8_namespace: {_eq: $namespace}
      }
    ) {
      id
      title
      user_auth_id
      description
      organization
      organization_name
      k8_namespace
      connectors{
        key
        space_id
      }
      user {
        auth_id
        email
      }
    }
  }
`;

const CREATE_SPACE = gql`
  mutation create_space(
    $title: String!
    $description: String!
    $user_auth_id: String!
    $organization: Int!
    $organization_name: String!
    $k8_namespace: String!
    $k8_namespace_uid: uuid!
  ) {
    insert_space_one(
      object: {
        title: $title
        description: $description
        user_auth_id: $user_auth_id
        organization: $organization
        k8_namespace: $k8_namespace
        organization_name: $organization_name
        k8_namespace_uid: $k8_namespace_uid
      }
    ) {
      id
      title
      user_auth_id
      description
      connectors{
        key
        space_id
      }
      # organization
    }
  }
`;

const DELETE_SPACE = gql`
  mutation delete_space(
    $id: uuid!
  ) {
    delete_space_by_pk(id: $id) {
      id
      title
      user_auth_id
      organization_name,
      k8_namespace
      # organization
    }
  }
`;

const SELECT_CONNECTOR = gql`
  query select_connector($id: uuid!) {
    connector_by_pk(id: $id) {
      space_id
    }
  }
`;

const ADD_CONNECTOR = gql`
  mutation add_connector(
    $key: String!
    $space_id: uuid!
    # $secret_key: String!
  ) {
    insert_connector_one(
      object: {
        key: $key
        space_id: $space_id
      }
    ) {
      id
      key
      # secret_key
      space_id
    }
  }
`;

const DELETE_CONNECTOR = gql`
  mutation delete_connector(
    $id: uuid!
  ) {
    delete_connector_by_pk(id: $id) {
      id
      key
      space_id
    }
  }
`;

const ADD_TAG = gql`
  mutation add_tag($id: uuid!, $tags: jsonb!) {
    update_space_by_pk(pk_columns: {id: $id}, _append: {tags: $tags}){
      tags
    }
  }
`;

const DELETE_TAG = gql`
  mutation delete_tag($id: uuid!, $tags: String!) {
    update_space_by_pk(pk_columns: {id: $id}, _delete_key: {tags: $tags}) {
      tags
    }
  }
`;

module.exports = {
  SELECT_CONNECTOR,
  GET_SPACES,
  CREATE_SPACE,
  DELETE_SPACE,
  ADD_CONNECTOR,
  DELETE_CONNECTOR,
  ADD_TAG,
  DELETE_TAG,
};
