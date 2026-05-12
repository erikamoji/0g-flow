require('@nomiclabs/hardhat-waffle');

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: '0.8.20',
  networks: {
    og0testnet: {
      url: 'https://evm-rpc.testnet.0g.ai',
      chainId: 16600,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
