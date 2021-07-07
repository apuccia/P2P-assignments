const Mayor = artifacts.require("Mayor");
const Soul = artifacts.require("Soul");

module.exports = async function (deployer, network, accounts) {
  const candidates = accounts.slice(0, 2);
  const escrow = accounts[9];
  const quorum = 1;

  await deployer.deploy(Mayor, candidates, escrow, quorum);

  const mayorIstance = await Mayor.deployed();

  // print contract address and other infos
  console.log("Mayor contract address: " + mayorIstance.address);
  console.log("The candidates are " + candidates);
  console.log("Escrow account: " + escrow);
  console.log("Quorum: " + quorum);
};
