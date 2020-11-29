const { gql } = require('apollo-boost');

const CREATE_USER_TOPIC = gql`
  mutation ($topic_name: String!, $user_auth_id: String!) {
    insert_user_topic_map_one(object: {topic_name: $topic_name, user_auth_id: $user_auth_id}) {
      topic_name
      user_auth_id
      id
    }
  }
`;

const DELETE_USER_TOPIC = gql`
  mutation MyMutation($user_auth_id: String!, $topic_name: String!) {
    delete_user_topic_map(where: {user_auth_id: {_eq: $user_auth_id}, topic_name: {_eq: $topic_name}}) {
      returning {
        user_auth_id
        topic_name
        id
      }
    }
  }
`;

const GET_USER_TOPICS = gql`
  query MyQuery($user_auth_id: String!) {
    user_topic_map(where: {user_auth_id: {_eq: $user_auth_id}}) {
      user_auth_id
      topic_name
      id
    }
  }
`;

module.exports = {
  CREATE_USER_TOPIC,
  DELETE_USER_TOPIC,
  GET_USER_TOPICS,
};
