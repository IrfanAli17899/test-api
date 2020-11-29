const { gql } = require('apollo-boost');

const CREATE_USER = gql`
  mutation($email: String!, $password: String, $username: String!, $auth_id: String!, $name: String) {
    insert_user_one(
      object: { email: $email, password: $password, username: $username, auth_id: $auth_id, name: $name }
    ) {
      id
      auth_id
      username
      name
      email
      created_at
      updated_at
    }
  }
`;

const GET_USER = gql`
  query user(
    $id: uuid
    $email: String
    $password: String
    $username: String
    $auth_id: String
  ) {
    user(
      where: {
        email: { _eq: $email }
        password: { _eq: $password }
        username: { _eq: $username }
        id: { _eq: $id }
        auth_id: {_eq: $auth_id}
      }
    ) {
        about_me
        address
        auth_id
        birth_date
        city
        country
        email
        name
        postal_code
        username
    }
  }
`;

const GET_USER_BY_EMAIL_OR_USERNAME = gql`
  query get_user_by_email_or_username($email: String, $username: String) {
    user(
      where: {
        _or: [{ email: { _eq: $email } }, { username: { _eq: $username } }]
      }
    ) {
      id
      username
      email
      created_at
      updated_at
    }
  }
`;

const CREATE_USER_TOKEN = gql`
  mutation insert_token_one($token: String!, $user_id: uuid!) {
    insert_token_one(object: { token: $token, user_id: $user_id }) {
      id
      user_id
      token
      created_at
      updated_at
    }
  }
`;

const GET_TOKEN = gql`
  query get_token($token: String!) {
    token(where: { token: { _eq: $token } }) {
      id
      user{
        id
        username
        email
        created_at
        updated_at
      }
      token
      created_at
      updated_at
    }
  }
`;

const UPDATE_USER = (arg) => {
  const set = [];
  const args = [];
  Object.entries(arg).forEach(([key, value]) => {
    if (value !== undefined) {
      set.push(`${key}: $${key}`);
      if (key === 'birth_date') args.push(`$${key}: date`);
      else args.push(`$${key}: String`);
    }
  });
  return gql`
  mutation update_user($auth_id: String!, ${args.join()}) {
    update_user(where: {auth_id: {_eq: $auth_id}}, _set: {${set.join()}}) {
      returning {
        about_me
        address
        auth_id
        birth_date
        city
        country
        email
        name
        postal_code
        username
      }
    }
  }
`;
};

module.exports = {
  CREATE_USER,
  GET_USER,
  CREATE_USER_TOKEN,
  GET_TOKEN,
  GET_USER_BY_EMAIL_OR_USERNAME,
  UPDATE_USER,
};
