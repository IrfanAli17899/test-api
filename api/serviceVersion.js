const { gql } = require('apollo-boost');
const gitea = require('../libs/gitea');
const GQLClient = require('../libs/apolloClient');
const { ApiError } = require('../helpers');
const { serviceVersionValidator } = require('../helpers/validators');
const { runTrigger } = require('../libs/cloudbuild');

const {
  SERVICE_QUERIES: { GET_SERVICES },
  SERVICE_VERSION_QUERIES: { GET_SERVICE_VERSIONS },
} = require('../libs/queries');

const createServiceVersion = async (req, res, next) => {
  try {
    const {
      error: validationError,
      value: validValue,
    } = serviceVersionValidator.createServiceVersion.validate(req.body);

    if (validationError) {
      throw new ApiError(400, validationError.message);
    }

    const {
      service_id, tag, title, note, is_prerelease,
    } = validValue;

    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: { id: service_id, user_auth_id: req.user.sub },
    });

    if (!service) {
      throw new ApiError(404, 'Service not found');
    }

    if (!service.has_unversioned_changes) {
      throw new ApiError(400, 'No changes to version');
    }

    const { service_versions: [existingVersion] } = await GQLClient.query({
      query: GET_SERVICE_VERSIONS,
      variables: { service_id: service.id, tag },
    });

    if (existingVersion) {
      throw new ApiError(400, 'Version tag already exists');
    }

    const { service_version: serviceVersion } = await GQLClient.mutate({
      variables: {
        service_id: service.id,
        draft_id: service.latest_draft.id,
        is_prerelease,
        tag,
        title,
        note,
      },
      mutation: gql`
        mutation VersionServiceLatestDraft(
          $service_id: uuid!
          $draft_id: uuid!,
          $tag: String!,
          $is_prerelease: Boolean!,
          $title: String,
          $note: String
        ) {
          service_version: update_service_version_by_pk(
            pk_columns: {id: $draft_id},
            _set: {
              is_draft: false,
              is_prerelease: $is_prerelease,
              tag: $tag,
              title: $title,
              note: $note
            }
          ) {
            id,
            service_id,
            tag,
            title,
            note,
            is_prerelease,
            is_draft,
            gitea_id
          }

          update_service_by_pk(
            pk_columns: {id: $service_id},
            _set: {
              has_unversioned_changes: false,
              latest_draft: null,
              latest_version: $draft_id
            }
          ) { id }
        }
      `,
    });

    gitea.releases.update({
      owner: service.space.organization_name,
      repository: service.repo_name,
      release_id: serviceVersion.gitea_id,
      tag,
      title,
      note,
      is_prerelease,
      is_draft: false,
    });

    res.send({ success: true, data: serviceVersion });
  } catch (error) {
    next(error);
  }
};

const selectActiveVersion = async (req, res, next) => {
  try {
    const {
      error: validationError,
      value: validValue,
    } = serviceVersionValidator.selectServiceVersion.validate(req.body);

    if (validationError) {
      throw new ApiError(400, validationError.message);
    }

    const { service_id, version_id } = validValue;

    const { service: [{ service_versions: [serviceVersion], ...service }] } = await GQLClient.query({
      variables: { service_id, version_id, user_auth_id: req.user.sub },
      query: gql`
        query GetServiceAndVersion($service_id: uuid!, $version_id: uuid!, $user_auth_id: String!) {
          service(
            where: {
              id: {_eq: $service_id},
              user_auth_id: {_eq: $user_auth_id}
            }
          ) {
            id,
            active_version,
            repo_name,
            url,
            space {
              id,
              organization_name,
              k8_namespace
            },
            service_versions(where: { id: {_eq: $version_id} }) {
              id,
              target_commit,
              tag,
              is_prerelease,
              is_draft
            }
          }
        }
      `,
    });

    const error = null
      || (!service && new ApiError(404, 'Service not found'))
      || (!serviceVersion && new ApiError(404, 'Version not found'))
      || (service.active_version === version_id && new ApiError(400, 'Version is already active'));

    if (error) {
      throw error;
    }

    await GQLClient.mutate({
      variables: { service_id, version_id },
      mutation: gql`
        mutation SetServiceActiveVersion($service_id: uuid!, $version_id: uuid!) {
          update_service_by_pk(
            pk_columns: {id: $service_id},
            _set: {active_version: $version_id}
          ) {
            id
            active_version
          }
        }
      `,
    });

    const build = await runTrigger({
      repoName: service.repo_name,
      repoUser: service.space.organization_name,
      tenatId: service.space.k8_namespace,
      dnsName: service.url,
      // ? commitSha: serviceVersion.target_commit,
      deploymentName: service.repo_name,
    });

    await GQLClient.mutate({
      variables: {
        service_id: service.id,
        build_id: build.data.metadata.build.id,
      },
      mutation: gql`
        mutation UpdateServiceBuildId($service_id: uuid!, $build_id: uuid!) {
          update_service_by_pk(
            pk_columns: {id: $service_id},
            _set: {build_id: $build_id}
          ) {
            id
            build_id
          }
        }
      `,
    });

    res.send({ success: true, data: serviceVersion });
  } catch (error) {
    next(error);
  }
};

const getServiceVersions = async (req, res, next) => {
  try {
    const {
      error: validationError,
      value: validValue,
    } = serviceVersionValidator.getServiceVersions.validate(req.body);

    if (validationError) {
      throw new ApiError(400, validationError.message);
    }

    const { service_versions } = await GQLClient.query({
      query: GET_SERVICE_VERSIONS,
      variables: validValue,
    });

    res.send(service_versions);
  } catch (error) {
    next(error);
  }
};

/**
 * @summary Should be called after any service repo change. Not an API endpoint handler.
 */
const updateDraftServiceVersion = async (service) => {
  const { commit } = await gitea.branches.get({
    owner: service.space.organization_name,
    repository: service.repo_name,
    branch: 'master',
  });

  let latestDraft;

  if (service.latest_draft) {
    await gitea.releases.update({
      owner: service.space.organization_name,
      repository: service.repo_name,
      release_id: service.latest_draft.gitea_id,
      target_commit: commit,
    });

    const updateDraftVersionResponse = await GQLClient.mutate({
      variables: {
        id: service.latest_draft.id,
        target_commit: commit,
      },
      mutation: gql`
        mutation UpdateDraftVersion($id: uuid!, $target_commit: String!) {
          latest_draft: update_service_version_by_pk(
            pk_columns: {id: $id},
            _set: { target_commit: $target_commit }
          ) {
            id,
            target_commit
          }
        }
      `,
    });

    latestDraft = updateDraftVersionResponse.latest_draft;
  } else {
    const giteaRelease = await gitea.releases.create({
      owner: service.space.organization_name,
      repository: service.repo_name,
      target_commit: commit,
      is_draft: true,
      is_prerelease: true,
      tag: 'latest-draft',
      title: 'Unversioned changes',
    });

    const createDraftVersionResponse = await GQLClient.mutate({
      variables: {
        service_id: service.id,
        gitea_id: giteaRelease.id,
        target_commit: commit,
      },
      mutation: gql`
        mutation CreateDraftVersion($service_id: uuid!, $gitea_id: Int!, $target_commit: String!) {
          latest_draft: insert_service_version_one(
            object: {
              service_id: $service_id,
              gitea_id: $gitea_id,
              is_draft: true,
              is_prerelease: true,
              title: "Unversioned changes",
              tag: "latest-draft",
              target_commit: $target_commit
            }
          ) {
            id,
            target_commit
          }
        }
      `,
    });

    latestDraft = createDraftVersionResponse.latest_draft;

    await GQLClient.mutate({
      variables: {
        service_id: service.id,
        latest_draft_id: latestDraft.id,
        active_version_id: service.active_version && service.active_version_id !== latestDraft.id
          ? service.active_version.id
          : latestDraft.id,
      },
      mutation: gql`
        mutation UpdateServiceLatestDraft(
          $service_id: uuid!,
          $latest_draft_id: uuid!,
          $active_version_id: uuid!
        ) {
          update_service_by_pk(
            pk_columns: {id: $service_id},
            _set: {
              has_unversioned_changes: true,
              latest_draft: $latest_draft_id,
              active_version: $active_version_id
            }
          ) {
            id
          }
        }
      `,
    });
  }

  if (!service.active_version_id || service.active_version_id === latestDraft.id) {
    const build = await runTrigger({
      repoName: service.repo_name,
      repoUser: service.space.organization_name,
      tenatId: service.space.k8_namespace,
      dnsName: service.url,
      // ? commitSha: latestDraft.target_commit,
      deploymentName: service.repo_name,
    });

    await GQLClient.mutate({
      variables: {
        service_id: service.id,
        build_id: build.data.metadata.build.id,
      },
      mutation: gql`
        mutation UpdateServiceBuildId($service_id: uuid!, $build_id: uuid!) {
          update_service_by_pk(
            pk_columns: {id: $service_id},
            _set: {build_id: $build_id}
          ) {
            id
            build_id
          }
        }
      `,
    });
  }
};

module.exports = {
  createServiceVersion,
  selectActiveVersion,
  getServiceVersions,
  updateDraftServiceVersion,
};
