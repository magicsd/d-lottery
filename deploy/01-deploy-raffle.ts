import type { DeployFunction } from 'hardhat-deploy/types'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'
import { developmentChainIds, networkConfig, networks } from '../helper-hardhat-config'
import { VRFCoordinatorV2Mock } from '../typechain-types'
import { verify } from '../verify/verify'


const deployFunction: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // @ts-ignore
  const { deployments, getNamedAccounts, network, ethers } = hre

  const VRF_SUBSCRIPTION_FUND_AMOUNT: bigint = ethers.parseEther('30')

  const { log, deploy, get } = deployments

  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId

  if (!chainId) {
    throw new Error('ChainId not found')
  }

  let vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
  let subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID)

  const isDevChain = developmentChainIds.includes(chainId)

  if (isDevChain) {
    const vrfCoordinatorV2Mock = (await ethers.getContract('VRFCoordinatorV2Mock')) as VRFCoordinatorV2Mock
    vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress()
    const txResponse = await vrfCoordinatorV2Mock.createSubscription()
    const txReceipt = await txResponse.wait()
    subscriptionId = (txReceipt.logs[0] as any).args[0]
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUBSCRIPTION_FUND_AMOUNT)
  }

  log('Deploying FundMe contract...')

  const ticketPrice = networkConfig[chainId].ticketPrice
  const gasLane = networkConfig[chainId].keyHash
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit
  const interval = networkConfig[chainId].interval

  const args = [vrfCoordinatorV2Address, ticketPrice, gasLane, subscriptionId, callbackGasLimit, interval]

  const raffle = await deploy('Raffle', {
    from: deployer,
    log: true,
    args,
    waitConfirmations: chainId === networks.sepolia.chainId ? 6 : 1,
  })

  if (!isDevChain && process.env.ETHERSCAN_API_KEY) {
    await verify(raffle.address, args)
  }

  log('----------------------------------------------------')
}

deployFunction.tags = ['all', 'raffle']

export default deployFunction
