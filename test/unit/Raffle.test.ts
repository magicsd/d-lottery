import { ethers, getNamedAccounts, deployments, network } from 'hardhat'
import type { Raffle, VRFCoordinatorV2Mock } from '../../typechain-types'
import { expect } from 'chai'
import { developmentChainIds, networkConfig } from '../../helper-hardhat-config.ts'

const { chainId } = network.config

const isDevNetwork = chainId ? developmentChainIds.includes(chainId) : false

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
!isDevNetwork
  ? describe.skip
  : describe('Raffle', () => {
      let raffle: Raffle
      let deployer: string
      let ticketPrice: string
      let interval: string
      let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock

      beforeEach(async () => {
        await deployments.fixture('all')

        deployer = (await getNamedAccounts()).deployer

        raffle = await ethers.getContract('Raffle', deployer)
        ticketPrice = (await raffle.getTicketPrice()).toString()
        interval = (await raffle.getInterval()).toString()
        vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
      })

      describe('constructor', () => {
        it('initializes the raffle correctly', async () => {
          const raffleState = await raffle.getRaffleState()

          expect(raffleState.toString()).to.equal('0')
          expect(interval).to.equal(networkConfig[chainId!].interval)
        })
      })

      describe('enter', () => {
        it('reverts if not enough value sent', async () => {
          const tx = raffle.enter()

          await expect(tx).to.be.revertedWithCustomError(raffle, 'Raffle__NotEnoughValueEntered')
        })

        it('adds account to players array', async () => {
          const txResponse = await raffle.enter({ value: ticketPrice })

          await txResponse.wait(1)

          const player = await raffle.getPlayer(0)

          expect(player).to.equal(deployer)
        })

        it('emits Enter when account enters', async () => {
          const tx = raffle.enter({ value: ticketPrice })

          await expect(tx).to.emit(raffle, 'Enter').withArgs(deployer)
        })

        it.skip('does not allow entrance when raffle is calculating', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])
          // same: await network.provider.request({ method: 'evm_mine', params: [] })
          await raffle.performUpkeep('0x')
          const raffleState = await raffle.getRaffleState()

          expect(raffleState.toString()).to.equal('1')

          const tx = raffle.enter({ value: ticketPrice })

          await expect(tx).to.be.revertedWithCustomError(raffle, 'Raffle__RaffleClosed')
        })
      })

      describe('checkUpkeep', () => {
        it('returns false if people have not sent any value', async () => {
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])

          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')

          expect(upkeepNeeded).to.equal(false)
        })

        it.skip('returns false if raffle is not open', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])
          await raffle.performUpkeep('0x')
          const raffleState = await raffle.getRaffleState()

          expect(raffleState.toString()).to.equal('1')

          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')

          expect(upkeepNeeded).to.equal(false)
        })

        it.skip('returns true of enough time has passes, has players and is open', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])
          await raffle.performUpkeep('0x')
          const raffleState = await raffle.getRaffleState()

          expect(raffleState.toString()).to.equal('1')

          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')

          expect(upkeepNeeded).to.equal(true)
        })
      })
    })
