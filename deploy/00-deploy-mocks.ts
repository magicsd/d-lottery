import type { DeployFunction } from 'hardhat-deploy/types'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChainIds } from '../helper-hardhat-config'

const deployFunction: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  //@ts-ignore
  const { deployments, getNamedAccounts, network, ethers } = hre

  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId

  if (!chainId) {
    throw new Error('ChainId not found')
  }

  if (!developmentChainIds.includes(chainId)) return

  log('Localhost detected, deploying mocks...')

  const baseFee = ethers.parseEther('0.25')
  const gasPriceLink = 1e9

  await deploy('VRFCoordinatorV2Mock', {
    contract: 'VRFCoordinatorV2Mock',
    from: deployer,
    log: true,
    args: [baseFee, gasPriceLink],
  })

  log('Mocks deployed!')
  log('----------------------------------------------------')
}

deployFunction.tags = ['all', 'mocks']

export default deployFunction
