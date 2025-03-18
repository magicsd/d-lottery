import type { DeployFunction } from 'hardhat-deploy/types'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChainIds, networkConfig, networks } from '../helper-hardhat-config'
import { VRFCoordinatorV2_5Mock } from '../typechain-types'
import { verify } from '../verify/verify'


const deployFunction: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const { deployments, getNamedAccounts, network, ethers } = hre

  const VRF_SUBSCRIPTION_FUND_AMOUNT: bigint = ethers.parseEther('30')

  const { log, deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId

  if (!chainId) {
    throw new Error('ChainId not found')
  }

  let vrfCoordinatorV2_5Address = networkConfig[chainId].vrfCoordinatorV2_5
  let subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID || '')

  const isDevChain = developmentChainIds.includes(chainId)

  let vrfCoordinatorV2_5Mock: VRFCoordinatorV2_5Mock

  if (isDevChain) {
    vrfCoordinatorV2_5Mock = (await ethers.getContract('VRFCoordinatorV2_5Mock')) as VRFCoordinatorV2_5Mock

    vrfCoordinatorV2_5Address = await vrfCoordinatorV2_5Mock.getAddress()

    const txResponse = await vrfCoordinatorV2_5Mock.createSubscription()
    const txReceipt = await txResponse.wait()
    subscriptionId = (txReceipt?.logs[0] as any).args[0]
    await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, VRF_SUBSCRIPTION_FUND_AMOUNT)
  }

  log('Deploying FundMe contract...')

  const ticketPrice = networkConfig[chainId].ticketPrice
  const gasLane = networkConfig[chainId].keyHash
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit
  const interval = networkConfig[chainId].interval

  const args = [subscriptionId, vrfCoordinatorV2_5Address, ticketPrice, gasLane, callbackGasLimit, interval]

  const raffle = await deploy('Raffle', {
    from: deployer,
    log: true,
    args,
    waitConfirmations: chainId === networks.sepolia.chainId ? 6 : 1,
  })

  if (isDevChain) {
    await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, raffle.address)
  }

  if (!isDevChain && process.env.ETHERSCAN_API_KEY) {
    await verify(raffle.address, args)
  }

  log('----------------------------------------------------')
}

deployFunction.tags = ['all', 'raffle']

export default deployFunction
