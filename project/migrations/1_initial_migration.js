const Mayor = artifacts.require("Mayor");
const SOUToken = artifacts.require("SOUToken");

module.exports = async function (deployer, network, accounts) {
  const candidates = accounts.slice(0, 2);
  const escrow = accounts[9];
  const quorum = 1;

  await deployer.deploy(SOUToken);
  const soulInstance = await SOUToken.deployed();

  await deployer.deploy(
    Mayor,
    candidates,
    escrow,
    quorum,
    soulInstance.address
  );
  const mayorInstance = await Mayor.deployed();

  // print contract address and other infos
  console.log("Mayor contract address: " + mayorInstance.address);
  console.log("SOUToken contract address: " + soulInstance.address);
  console.log("The candidates are " + candidates);
  console.log("Escrow account: " + escrow);
  console.log("Quorum: " + quorum);
};
