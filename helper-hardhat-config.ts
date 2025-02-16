import { ethers } from 'hardhat'

export type ChainId = number

export type DevelopmentNetworkName = 'hardhat' | 'localhost'
export type NetworkName = 'sepolia' | DevelopmentNetworkName

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || ''

type Config = { chainId: ChainId; rpcUrl?: string }

export const networks: Record<NetworkName, Config> = {
  hardhat: {
    chainId: 31337,
  },
  localhost: {
    chainId: 31337,
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: SEPOLIA_RPC_URL,
  },
}

type NetworkConfig = {
  name: NetworkName
  rpcUrl?: string
  vrfCoordinatorV2: string
  ticketPrice: BigInt
  keyHash: string
  callbackGasLimit: string
  interval: string
}

export const networkConfig: Record<ChainId, NetworkConfig> = {
  [networks.hardhat.chainId]: {
    name: 'hardhat',
    vrfCoordinatorV2: '',
    ticketPrice: ethers.parseEther('0.01'),
    keyHash: '',
    callbackGasLimit: '500000',
    interval: '30',
  },
  [networks.sepolia.chainId]: {
    name: 'sepolia',
    vrfCoordinatorV2: '0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B',
    ticketPrice: ethers.parseEther('0.01'),
    keyHash: '0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae',
    callbackGasLimit: '500000',
    interval: '30',
  },
}

export const developmentChainIds = [networks.hardhat.chainId, networks.localhost.chainId]
