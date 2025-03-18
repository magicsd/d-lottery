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
  // current LINK/ETH price
  const weiPerUnit = 7359502625961095

  await deploy('VRFCoordinatorV2_5Mock', {
    contract: 'VRFCoordinatorV2_5Mock',
    from: deployer,
    log: true,
    args: [baseFee, gasPriceLink, weiPerUnit],
  })

  log('Mocks deployed!')
  log('----------------------------------------------------')
}

deployFunction.tags = ['all', 'mocks']

export default deployFunction
