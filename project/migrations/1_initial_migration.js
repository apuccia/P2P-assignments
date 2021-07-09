var Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  // Deploy the Migrations contract as our only task

  const escrow = accounts[9];

  deployer.deploy(Migrations, { from: escrow });
};
