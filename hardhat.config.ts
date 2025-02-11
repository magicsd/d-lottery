import type { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
import '@nomicfoundation/hardhat-verify'
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'
import 'solidity-coverage'
import 'dotenv/config'

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  defaultNetwork: 'localhost',
  networks: {
    // sepolia: {
    //   url: networks.sepolia.rpcUrl,
    //   accounts: [SEPOLIA_PRIVATE_KEY],
    //   chainId: networks.sepolia.chainId,
    // },
    localhost: {
      url: 'http://127.0.0.1:8545/',
      chainId: 31337,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  gasReporter: {
    enabled: true,
    offline: true,
    // coinmarketcap: COINMARKETCAP_API_KEY,
    // L1Etherscan: ETHERSCAN_API_KEY,
    outputFile: 'gas-report.txt',
    noColors: true,
    currency: 'USD',
  },
}

export default config
