const keygen = require('ssh-keygen');

const createSSHPair = (comment) => new Promise((res, rej) => {
  keygen(
    {
      comment,
      read: true,
      format: 'PEM',
    },
    (err, out) => (err ? rej(err) : res(out)),
  );
});

module.exports = { createSSHPair };
