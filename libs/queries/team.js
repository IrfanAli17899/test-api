const { gql } = require('apollo-boost');

const ADD_USER_TO_TEAM = gql`
  mutation insert_user_team_map_one($team_id: uuid!, $user_auth_id: String!, $access_level: Int!) {
    insert_user_team_map_one(object: {team_id: $team_id, user_auth_id: $user_auth_id, access_level: $access_level}) {
      user_auth_id
      team_id
      id
    }
  }
`;

const GET_EXISTING_USER_TEAM_PAIR = gql`
  query user_team_map($team_id: uuid!, $user_auth_id: String!) {
    user_team_map(where: {team_id: {_eq: $team_id}, user_auth_id: {_eq: $user_auth_id}}) {
      id
    }
  }
`;

const GET_MEMBERSHIP = gql`
  query user_team_map($team_id: uuid, $user_auth_id: String) {
    user_team_map(where: {team_id: {_eq: $team_id}, user_auth_id: {_eq: $user_auth_id}}) {
      id
      user {
        auth_id
        email
      }
      access_level
      team {
        title
        space {
          id
          title
        }
      }
      assignments
    }
  }
`;

const GET_TEAM = gql`
  query team($title: String, $id: uuid, $space_id: uuid, $assignments: [uuid!], $user_auth_id: String) {
    team(where: {
      title: {_eq: $title}, id: {_eq: $id},
      space_id: {_eq: $space_id},
      space: {_or:[
        {id: {_in: $assignments}}, {user_auth_id: {_eq: $user_auth_id}}
      ]}
    }) {
      space_id
      title
      id
    }
  }
`;

const DELETE_MEMBER_FROM_TEAM = gql`
  mutation delete_user_team_map($team_id: uuid!, $user_auth_id: String!) {
    delete_user_team_map(where: {team_id: {_eq: $team_id}, user_auth_id: {_eq: $user_auth_id}}) {
      returning {
        team_id
        user_auth_id
      }
    }
  }
`;

const CREATE_TEAM = gql`
  mutation insert_team($space_id: uuid!, $title: String!) {
    insert_team(objects: {space_id: $space_id, title: $title}) {
      returning {
        id
        space_id
        title
      }
    }
  }
`;

const DELETE_TEAM = gql`
  mutation delete_team($title: String!) {
    delete_team(where: {title: {_eq: $title}}) {
      returning {
        id
        title
        space_id
      }
    }
  }
`;

const SET_ASSIGNMENTS = gql`
  mutation update_user_team_map($team_id: uuid, $user_auth_id: String, $assignments: jsonb!, $id: uuid!) {
    update_user_team_map(_append: {assignments: $assignments}, where: {id: {_eq: $id}}) {
      returning {
        id
        assignments
      }
    }
  }
`;

const GET_ASSIGNMENTS = gql`
  query user_team_map($team_id: uuid, $user_auth_id: String, $access_level: Int, $id: uuid) {
    user_team_map(
      where: {
        team_id: {_eq: $team_id},
        id: {_eq: $id},
        user_auth_id: {_eq: $user_auth_id},
        _or: [
          { access_level: {_eq: $access_level} },
          { team: { access_level: {_eq: $access_level} } }
        ]
      }
    ) {
      id
      access_level
      assignments
      user {
        auth_id
        email
      }
      team {
        id
        title
        space_id
        access_level
        space {
          services {
            id
            user_auth_id
          }
        }
      }
    }
  }
`;

const UPDATE_USERS_ROLE = gql`
  mutation ($access_level: Int!, $id: uuid!) {
    update_user_team_map_by_pk(_set: {access_level: $access_level}, pk_columns: {id: $id}) {
      id
      access_level
      assignments
      user_auth_id
      team_id
    }
  }
`;

const AccessLevels = Object.freeze({
  ADMIN: 1,
  OPERATOR: 2,
  USER: 3,
});

module.exports = {
  GET_MEMBERSHIP,
  GET_TEAM,
  ADD_USER_TO_TEAM,
  DELETE_MEMBER_FROM_TEAM,
  GET_EXISTING_USER_TEAM_PAIR,
  CREATE_TEAM,
  DELETE_TEAM,
  SET_ASSIGNMENTS,
  UPDATE_USERS_ROLE,
  GET_ASSIGNMENTS,
  AccessLevels,
};
