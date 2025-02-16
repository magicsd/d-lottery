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

  const vrfCoordinatorV2 = deployer
  const ticketPrice = ethers.parseEther('1')
  const gasLane = ''
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID
  const callbackGasLimit = ''

  const args = [vrfCoordinatorV2, ticketPrice, gasLane, subscriptionId, callbackGasLimit]

  await deploy('Raffle', { from: deployer, log: true, args })
}

deployFunction.tags = ['all']

export default deployFunction
