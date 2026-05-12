require('@nomicfoundation/hardhat-ethers');

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: '0.8.20',
  networks: {
    og0testnet: {
      url: 'https://evmrpc-testnet.0g.ai',
      chainId: 16602,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    og0mainnet: {
      url: 'https://evmrpc.0g.ai',
      chainId: 16661,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
