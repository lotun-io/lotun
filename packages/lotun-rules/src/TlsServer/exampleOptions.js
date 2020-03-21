const tls = require('tls');
const forge = require('node-forge@0.9.1');

function generateCertificate() {
  const keypair = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  const now = new Date();
  const oneYear = new Date(new Date(now).setFullYear(now.getFullYear() + 1));

  Object.assign(cert, {
    publicKey: keypair.publicKey,
    serialNumber: '01',
    validity: {
      notBefore: now,
      notAfter: oneYear,
    },
  });

  cert.sign(keypair.privateKey, forge.md.sha256.create()); // self signed
  // no subject, issuer, extensions: https://github.com/digitalbazaar/forge#x509
  const privPem = forge.pki.privateKeyToPem(keypair.privateKey);
  const certPem = forge.pki.certificateToPem(cert);

  return {
    key: privPem,
    cert: certPem,
  };
}

module.exports = async function options() {
  const { key, cert } = generateCertificate();
  const server = tls.createServer({ rejectUnauthorized: false });
  server.setSecureContext({ key, cert });

  return server;
};
