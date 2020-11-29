const { gql } = require('apollo-boost');

const GET_SERVICE_VERSIONS = gql`
  query GetServiceVersions(
    $service_id: uuid!,
    $version_id: uuid,
    $tag: String,
    $title: String,
    $is_draft: Boolean,
    $is_prerelease: Boolean
  ) {
    service_versions: service_version(
      where: {
        id: {_eq: $version_id},
        service_id: {_eq: $service_id},
        tag: {_eq: $tag},
        title: {_eq: $title},
        is_draft: {_eq: $is_draft}
        is_prerelease: {_eq: $is_prerelease}
      }
    ) {
      id
      gitea_id
      service_id
      tag
      target_commit
      is_draft
      is_prerelease
      title
      note
    }
  }
`;

const CREATE_SERVICE_VERSION = gql`
  mutation CreateServiceVersion(
    $gitea_id: Int!,
    $service_id: uuid!,
    $tag: String!,
    $target_commit: String!,
    $is_draft: Boolean!,
    $is_prerelease: Boolean!,
    $title: String,
    $note: String
  ) {
  insert_service_version_one(
    object: {
      gitea_id: $gitea_id,
      service_id: $service_id,
      tag: $tag,
      target_commit: $target_commit,
      is_draft: $is_draft,
      is_prerelease: $is_prerelease,
      title: $title,
      note: $note
    }
  ) {
      id
      gitea_id
      service_id
      tag
      target_commit
      is_draft
      is_prerelease
      title
      note
    }
  }
`;

module.exports = {
  GET_SERVICE_VERSIONS,
  CREATE_SERVICE_VERSION,
};
