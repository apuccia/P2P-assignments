const Mayor = artifacts.require("Mayor");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(Mayor, accounts.slice(0, 2), accounts[9], 9);
};
