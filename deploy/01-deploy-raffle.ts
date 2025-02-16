import type { DeployFunction } from 'hardhat-deploy/types'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

const deployFunction: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // @ts-ignore
  const { deployments, getNamedAccounts, network, ethers } = hre

  const { log, deploy, get } = deployments

  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId

  if (!chainId) {
    throw new Error('ChainId not found')
  }

  log('Deploying FundMe contract...')

  await deploy('Raffle', { from: deployer, log: true, args: [deployer, ethers.parseEther('1')] })
}

deployFunction.tags = ['all']

export default deployFunction
