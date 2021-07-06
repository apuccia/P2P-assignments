const Mayor = artifacts.require("Mayor");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Mayor, accounts.slice(0, 2), accounts[9], 9);

  const mayorIstance = await Mayor.deployed();
  const soulAddress = await mayorIstance.token();

  // print contract addresses 
  // soul contract address is needed to import the token in metamask
  console.log("Mayor contract address: " + mayorIstance);
  console.log("Soul contract address: " + soulAddress);
};
