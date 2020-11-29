const { gql } = require('apollo-boost');

const GET_SERVICES = gql`
  query get_services(
    $assignments_space: [uuid!] = [], $assignments_service: [uuid!] = [],
    $user_auth_id: String!, $space_id: uuid, $id: uuid
    ) {
    service(where: {
      _and:[
        {_or: [{id: {_in: $assignments_service}}, {user_auth_id: {_eq: $user_auth_id}}]},
        {_or: [{space: {id: {_in: $assignments_space}}}, {space: {user_auth_id: {_eq: $user_auth_id}}}]}
      ],
        space_id: { _eq: $space_id }
        id: { _eq: $id }}) {
      id
      description
      title
      user_auth_id
      lock
      url
      repo_name
      build_id
      space {
        id
        title
        organization_name
        k8_namespace
      }
      user {
        auth_id
        email
      }
      latest_draft: serviceVersionByLatestDraft {
        id
        gitea_id
        target_commit
      }
      latest_version: serviceVersionByLatestVersion {
        id
        gitea_id
        target_commit
      }
      active_version: serviceVersionByActiveVersion {
        id
        gitea_id
        target_commit
      }
      has_unversioned_changes
    }
  }
`;

const GET_SERVICES_BY_ID_IN = gql`
  query get_services_by_id_in($in: [uuid!] = []) {
    service(where: {id: {_in: $in}}) {
      id
      title
    }
  }
`;

const GET_STARRED = gql`
  query get_starred($user_auth_id: String) {
    user_favourite_map(where: {user_auth_id: {_eq: $user_auth_id}}) {
      service_id
    }
  }
`;

const GET_PUBLIC_SERVICES = gql`
  query get_public_services($ilike: String) {
    service(where: {lock: {_eq: false}, title: {_ilike: $ilike}}) {
      description
      title
      url
    }
  }
`;

const CREATE_SERVICE = gql`
  mutation CreateService(
    $id: uuid!
    $title: String!
    $repo_name: String!
    $space_id: uuid!
    $user_auth_id: String!
    $repo: Int!
    $url: String!
    $description: String
  ) {
    new_service: insert_service_one(
      object: {
        id: $id
        title: $title
        repo_name: $repo_name
        repo: $repo
        space_id: $space_id
        user_auth_id: $user_auth_id
        url: $url
        description: $description
      }
    ) {
      id
      title
      description
      url
      repo_name
      space {
        id
        title
        organization_name
      }
      build_id
    }
  }
`;

const UPDATE_SERVICE = (arg) => {
  const set = [];
  const args = [];
  Object.entries(arg).forEach(([key, value]) => {
    if (value !== undefined) {
      set.push(`${key}: $${key}`);
      args.push(`$${key}: Boolean`);
    }
  });
  return gql`
    mutation update_service($id: uuid!, ${args.join()}) {
      update_service(where: {id: {_eq: $id}}, _set: {${set.join()}}) {
        returning {
          id
          title
          space {
            id
            title
          }
        }
      }
    }
  `;
};

const DELETE_SERVICE = gql`
  mutation delete_service($id: uuid!) {
    delete_service_by_pk(id: $id) {
      id
      space {
        id
        title
        organization
        organization_name
      }
      repo
      repo_name
    }
  }
`;

const STAR_SERVICE = gql`
  mutation star_service($service_id: uuid!, $user_auth_id: String!) {
    insert_user_favourite_map(objects: {service_id: $service_id, user_auth_id: $user_auth_id}) {
      returning {
        id
      }
    }
  }
`;

const UNSTAR_SERVICE = gql`
  mutation unstar_service($service_id: uuid!, $user_auth_id: String!) {
    delete_user_favourite_map(where: {service_id: {_eq: $service_id}, user_auth_id: {_eq: $user_auth_id}}) {
      returning {
        id
      }
    }
  }
`;

const ADD_TAG = gql`
  mutation add_tag_to_service($id: uuid!, $tags: jsonb!) {
    update_service_by_pk(pk_columns: {id: $id}, _append: {tags: $tags}){
      tags
    }
  }
`;

const DELETE_TAG = gql`
  mutation delete_tag_from_service($id: uuid!, $tags: String!) {
    update_service_by_pk(pk_columns: {id: $id}, _delete_key: {tags: $tags}) {
      tags
    }
  }
`;

module.exports = {
  GET_SERVICES,
  CREATE_SERVICE,
  DELETE_SERVICE,
  UPDATE_SERVICE,
  STAR_SERVICE,
  UNSTAR_SERVICE,
  GET_PUBLIC_SERVICES,
  ADD_TAG,
  DELETE_TAG,
  GET_STARRED,
  GET_SERVICES_BY_ID_IN,
};
