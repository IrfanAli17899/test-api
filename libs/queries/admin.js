const { gql } = require('apollo-boost');

const DELETE_ALL_SPACES = gql`
  mutation delete_all_spaces {
    delete_space(where: { }) {
      returning {
        id
        title
        uuid
        organization_name
        k8_namespace
      }
    }
  }
`;

module.exports = {
  DELETE_ALL_SPACES,
};
