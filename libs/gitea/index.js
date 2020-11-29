const { default: Axios } = require('axios');

const {
  GITEA_BASE_URL,
  GITEA_ACCESS_TOKEN,
  GIT_USER,
  GIT_USER_PASS,
} = require('../../config');

const giteaAxios = Axios.create({
  baseURL: GITEA_BASE_URL,
});

const getAllOrgs = async () => {
  try {
    const { data, status } = await giteaAxios.get(
      `/orgs?access_token=${GITEA_ACCESS_TOKEN}`,
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(error.response.data.message);
  }
};

const getAllUsers = async () => {
  try {
    const { data, status } = await giteaAxios.get(
      `/admin/users?access_token=${GITEA_ACCESS_TOKEN}`,
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(error.response.data.message);
  }
};

const createUser = async ({ email, password, username }) => {
  try {
    const { data, status } = await giteaAxios.post(
      `/admin/users?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        email,
        full_name: username,
        login_name: username,
        must_change_password: true,
        password,
        send_notify: true,
        source_id: 0,
        username,
      },
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(error.response.data.message);
  }
};

const createOrg = async ({ name, description }) => {
  try {
    const { data, status } = await giteaAxios.post(
      `/orgs?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        description,
        full_name: name,
        location: 'location',
        repo_admin_change_team_access: true,
        username: name,
        visibility: 'private',
        website: 'https://',
      },
    );
    return { success: true, status, data };
  } catch (error) {
    console.log(error.message);
    console.log(error);
    throw Error(error.response.data.message);
  }
};

const findOrgById = async (id) => {
  const { data = [] } = await getAllOrgs();
  return data.find((org) => org.id === id);
};

const deleteOrg = async (id) => {
  try {
    const { data, status } = await giteaAxios.delete(
      `/orgs/${id}?access_token=${GITEA_ACCESS_TOKEN}`,
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(error.response.data.message);
  }
};

const createRepo = async ({
  org,
  name,
  description,
  private: isPrivate,
  default_branch,
  readme = 'readme',
}) => {
  console.log({
    org,
    name,
    description,
    private: isPrivate,
    default_branch,
    readme,
  });
  try {
    const { status, data } = await giteaAxios.post(
      `/orgs/${org}/repos?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        auto_init: false,
        default_branch,
        description,
        gitignores: '',
        issue_labels: '',
        license: 'string',
        name: 10,
        private: isPrivate,
        readme,
      },
    );
    return { success: true, status, data };
  } catch (error) {
    console.log(error.message);
    throw Error(error.response.data.message);
  }
};

const getAllReposOfOrg = async (org) => {
  try {
    const { data, status } = await giteaAxios.get(
      `/orgs/${org}/repos?access_token=${GITEA_ACCESS_TOKEN}`,
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(error.response.data.message);
  }
};
const findRepoByIdInOrg = async (org, repo) => {
  console.log(org, repo);
  const { data = [] } = await getAllReposOfOrg(org);
  return data.find((r) => r.id === repo);
};

const deleteRepo = async (org, name) => {
  console.log(org, name);
  try {
    const { status, data } = await giteaAxios.delete(
      `/repos/${org}/${name}?access_token=${GITEA_ACCESS_TOKEN}`,
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(error.response.data.message);
  }
};

const repoMigrate = async ({
  clone_addr,
  repo_name,
  description,
  service,
  UID,
}) => {
  console.log({
    clone_addr,
    repo_name,
    description,
    service,
    UID,
  });
  try {
    const { status, data } = await giteaAxios.post(
      `/repos/migrate?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        auth_username: GIT_USER,
        auth_password: GIT_USER_PASS,
        clone_addr,
        repo_name,
        service,
        UID,
        description,
        issues: true,
        labels: true,
        milestones: true,
        mirror: false,
        private: true,
        pull_requests: true,
        releases: true,
        wiki: true,
      },
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(JSON.stringify(error.response.data));
  }
};

const putNewKeyToRepo = async (repo_name, repo_owner, title, key) => {
  try {
    const { status, data } = await giteaAxios.post(
      `/repos/${repo_owner}/${repo_name}/keys?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        key,
        read_only: true,
        title,
      },
    );
    return { success: true, status, data };
  } catch (error) {
    throw Error(JSON.stringify(error.response.data));
  }
};

const getRepoFile = async ({ repo_owner, repo_name, path }) => giteaAxios.get(
  `/repos/${repo_owner}/${repo_name}/contents/${path}?access_token=${GITEA_ACCESS_TOKEN}`,
);

const updateRepoFile = async ({
  repo_name,
  repo_owner,
  content,
  message,
  path,
}) => {
  try {
    const objJsonB64 = Buffer.from(content).toString('base64');

    const { data } = await getRepoFile({
      repo_name,
      repo_owner,
      path,
    });

    const { status, data2 } = await giteaAxios.put(
      `/repos/${repo_owner}/${repo_name}/contents/${path}?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        message,
        content: objJsonB64,
        sha: data.sha,
        committer: {
          name: 'IrfanAli17899',
          email: 'irfanali.17899@gmail.com',
        },
      },
    );
    return { success: true, status, data: data2 };
  } catch (error) {
    throw Error(JSON.stringify(error.response.data));
  }
};

const addFeatureInConfigJson = async ({ repo_name, repo_owner, feature }) => {
  try {
    const { data } = await getRepoFile({
      repo_name,
      repo_owner,
      path: 'src/config.json',
    });
    const config = JSON.parse(Buffer.from(data.content, 'base64').toString());
    config.features.push(feature);
    await updateRepoFile({
      repo_name,
      repo_owner,
      message: 'feature added in config.json',
      content: JSON.stringify(config),
      path: 'src/config.json',
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const removeFeatureFromConfigJson = async ({ repo_name, repo_owner, feature_repo_name }) => {
  try {
    const { data } = await getRepoFile({
      repo_name,
      repo_owner,
      path: 'src/config.json',
    });
    const config = JSON.parse(Buffer.from(data.content, 'base64').toString());
    const index = config.features.findIndex((item) => item.feature === feature_repo_name);
    config.features.splice(index, 1);
    await updateRepoFile({
      repo_name,
      repo_owner,
      message: 'feature deleted from config.json',
      content: JSON.stringify(config),
      path: 'src/config.json',
    });
    return { success: true };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const updatePackage = (info, pkg) => {
  const info_dependencies = info.packages.dependencies;
  const package_dependencies = pkg.dependencies;
  if (info_dependencies) {
    Object.keys(info_dependencies).forEach((key) => {
      if (!package_dependencies[key]) {
        console.log(`${key} <======not found`);
        package_dependencies[key] = info_dependencies[key];
        console.log(package_dependencies[key]);
      }
    });
  }
  return pkg;
};

const updateDependencies = async ({ repo_name, repo_owner, info }) => {
  try {
    const { data: pkg } = await getRepoFile({
      repo_name,
      repo_owner,
      path: 'package.json',
    });

    const newPackge = updatePackage(
      info,
      JSON.parse(Buffer.from(pkg.content, 'base64').toString()),
    );
    console.log('newPackge======>>', newPackge);
    await updateRepoFile({
      content: JSON.stringify(newPackge),
      message: 'package.json updated',
      path: 'package.json',
      repo_name,
      repo_owner,
    });
  } catch (error) {
    console.log('check updateDependencies====>>>', error);
    console.log(error);
  }
};

const postRepoFile = async ({
  repo_name,
  repo_owner,
  content,
  message,
  path,
}) => {
  try {
    await giteaAxios.post(
      `/repos/${repo_owner}/${repo_name}/contents/${path}?access_token=${GITEA_ACCESS_TOKEN}`,
      {
        message,
        content,
        committer: {
          name: 'IrfanAli17899',
          email: 'irfanali.17899@gmail.com',
        },
      },
    );
    return { success: true };
  } catch (error) {
    throw Error(JSON.stringify(error.response.data));
  }
};

const cloneFeatureFiles = async ({
  feature_repo_name,
  feature_repo_owner,
  repo_name,
  repo_owner,
  message,
  path,
}) => {
  try {
    console.log(path);
    const shortPath = path.slice(4);

    const { data } = await getRepoFile({
      repo_name: feature_repo_name,
      repo_owner: feature_repo_owner,
      path,
    });

    if (shortPath === 'info.json') {
      console.log('info found================+>');
      await updateDependencies({
        info: JSON.parse(Buffer.from(data.content, 'base64').toString()),
        repo_name,
        repo_owner,
      });
    }
    await postRepoFile({
      path: `src/Features/${feature_repo_name}/${shortPath}`,
      message,
      repo_name,
      repo_owner,
      content: data.content,
    });
    return { success: true };
  } catch (error) {
    console.log('check cloneFeatureFiles====>>>', error);
    return null;
    // throw Error(JSON.stringify(error.response));
  }
};

const cloneFeature = async ({
  feature_repo_name,
  feature_repo_owner,
  path,
  repo_name,
  repo_owner,
}) => {
  console.log({
    feature_repo_name,
    feature_repo_owner,
    path,
    repo_name,
    repo_owner,
  });
  try {
    const { data } = await getRepoFile({
      repo_name: feature_repo_name,
      repo_owner: feature_repo_owner,
      path,
    });
    for (let i = 0; i < data.length; i++) {
      if (data[i].type === 'dir') {
        // eslint-disable-next-line no-await-in-loop
        await cloneFeature({
          path: data[i].path,
          repo_name,
          repo_owner,
          feature_repo_name,
          feature_repo_owner,
        });
      } else {
        // eslint-disable-next-line no-await-in-loop
        await cloneFeatureFiles({
          message: `${data[i].path.split('/').pop()} file added in ${feature_repo_name}`,
          feature_repo_name,
          feature_repo_owner,
          repo_name,
          repo_owner,
          path: data[i].path,
        });
      }
    }
  } catch (error) {
    console.log('check cloneFeature====>>>', error);
    throw Error(JSON.stringify(error.response.data));
  }
};

module.exports = {
  putNewKeyToRepo,
  createUser,
  getAllOrgs,
  createOrg,
  deleteOrg,
  createRepo,
  deleteRepo,
  getAllUsers,
  findOrgById,
  findRepoByIdInOrg,
  repoMigrate,
  updateRepoFile,
  cloneFeature,
  addFeatureInConfigJson,
  removeFeatureFromConfigJson,

  /* eslint-disable global-require */
  repositories: require('./repositories'),
  releases: require('./releases'),
  branches: require('./branches'),
};
