const joi = require('joi');

const triggerTemplateSchema = joi.object({
  repoName: joi.string().required(),
  dir: joi.string().regex(/\..*/),
  invertRegex: joi.boolean(),
  substitutions: joi.object(),
  // Union field revision can be only one of the following:
  branchName: joi.string(),
  tagName: joi.string(),
  commitSha: joi.string(),
  // End of list of possible types for union field revision.
}).xor('branchName', 'tagName', 'commitSha');

const pushSchema = joi.object({
  invertRegex: joi.boolean(),
  // Union field git_ref can be only one of the following:
  branch: joi.string(),
  tag: joi.string(),
  // End of list of possible types for union field git_ref.
}).xor('branch', 'tag');

const pullRequestSchema = joi.object({
  commentControl: joi.string().valid(
    'COMMENTS_DISABLED',
    'COMMENTS_ENABLED',
    'COMMENTS_ENABLED_FOR_EXTERNAL_CONTRIBUTORS_ONLY',
  ),
  invertRegex: joi.boolean,
  branch: joi.string().required(),
});

const githubSchema = joi.object({
  owner: joi.string().required(),
  name: joi.string().required(),
  // Union field event can be only one of the following:
  pullRequest: pullRequestSchema,
  push: pushSchema,
  // End of list of possible types for union field event.
}).xor('pullRequest', 'push');

const storageSourceSchema = joi.object({
  bucket: joi.string().required(),
  object: joi.string().required(),
  generation: joi.string(),
});

const repoSourceSchema = joi.object({
  repoName: joi.string().required(),
  dir: joi.string().regex(/\..*/),
  invertRegex: joi.boolean(),
  substitutions: joi.object(),
  // Union field revision can be only one of the following:
  branchName: joi.string(),
  tagName: joi.string(),
  commitSha: joi.string(),
  // End of list of possible types for union field revision.
}).xor('branchName', 'tagName', 'commitSha');

const sourceSchema = joi.object({
  // Union field source can be only one of the following:
  storageSource: storageSourceSchema,
  repoSource: repoSourceSchema,
  // End of list of possible types for union field source.
}).xor('storageSource', 'repoSource');

const volumeSchema = joi.object({
  name: joi.string().required(),
  path: joi.string().required(),
});

const timingSchema = joi.object({
  startTime: joi.string(),
  endTime: joi.string(),
});

const buildStepSchema = joi.object({
  name: joi.string().required(),
  env: joi.array().items(joi.string()),
  args: joi.array().items(joi.string()),
  dir: joi.string().regex(/\..*/),
  id: joi.string(),
  waitFor: joi.array().items(joi.string()),
  entrypoint: joi.string(),
  secretEnv: joi.array().items(joi.string()),
  volumes: joi.array().items(volumeSchema),
  timing: timingSchema,
  pullTiming: timingSchema,
  timeout: joi.string(),
  status: joi.string().valid(
    'STATUS_UNKNOWN',
    'QUEUED',
    'WORKING',
    'SUCCESS',
    'FAILURE',
    'INTERNAL_ERROR',
    'TIMEOUT',
    'CANCELLED',
    'EXPIRED',
  ),
});

const secretSchema = joi.object({
  kmsKeyName: joi.string(),
  secretEnv: joi.object(),
});

const artifactObjectSchema = joi.object({
  location: joi.string().required(),
  paths: joi.array().items(joi.string()).required(),
});

const artifactSchema = joi.object({
  images: joi.array().items(joi.string()),
  objects: artifactObjectSchema,
});

const buildOptionsSchema = joi.object({
  sourceProvenanceHash: joi.array().items(joi.string().valid('NONE', 'SHA256', 'MD5')),
  requestedVerifyOption: joi.string().valid('NOT_VERIFIED', 'VERIFIED'),
  machineType: joi.string().valid('UNSPECIFIED', 'N1_HIGHCPU_8', 'N1_HIGHCPU_32'),
  diskSizeGb: joi.string(),
  substitutionOption: joi.string().valid('MUST_MATCH', 'ALLOW_LOOSE'),
  dynamicSubstitutions: joi.boolean(),
  logStreamingOption: joi.string().valid('STREAM_DEFAULT', 'STREAM_ON', 'STREAM_OFF'),
  workerPool: joi.string(),
  logging: joi.string().valid(
    'LOGGING_UNSPECIFIED',
    'LEGACY',
    'GCS_ONLY',
    'STACKDRIVER_ONLY',
    'NONE',
  ),
  env: joi.array().items(joi.string()),
  secretEnv: joi.array().items(joi.string()),
  volumes: joi.array().items(volumeSchema),
});

const buildSchema = joi.object({
  source: sourceSchema.required(),
  steps: joi.array().items(buildStepSchema).required(),
  timeout: joi.string(),
  images: joi.array().items(joi.string()),
  queueTtl: joi.string().regex(/\d*\.\d*s/),
  artifacts: artifactSchema,
  logsBucket: joi.string(),
  options: buildOptionsSchema,
  substitutions: joi.object(),
  tags: joi.array().items(joi.string()),
  secrets: joi.array().items(secretSchema),
});

const buildConfigSchema = joi.object({
  description: joi.string(),
  name: joi.string().min(1).max(64).required(),
  tags: joi.array().items(joi.string()),
  triggerTemplate: triggerTemplateSchema,
  github: githubSchema,
  disabled: joi.boolean(),
  substitutions: joi.object().pattern(/^_[A-Z0-9_]+$/, joi.string()),
  ignoredFiles: joi.array().items(joi.string()),
  includedFiles: joi.array().items(joi.string()),
  // Union field build_template can be only one of the following:
  build: buildSchema,
  filename: joi.string(),
  // End of list of possible types for union field build_template.
}).xor('triggerTemplate', 'github').xor('build', 'filename');

module.exports = { buildConfigSchema };
