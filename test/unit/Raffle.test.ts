import { ethers, getNamedAccounts, deployments, network } from 'hardhat'
import type { Raffle, VRFCoordinatorV2_5Mock } from '../../typechain-types'
import { expect } from 'chai'
import { developmentChainIds, networkConfig } from '../../helper-hardhat-config.ts'
import { beforeEach, describe } from 'mocha'
import { type EventLog } from 'ethers'

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
      let vrfCoordinatorV2_5Mock: VRFCoordinatorV2_5Mock

      beforeEach(async () => {
        await deployments.fixture('all')

        deployer = (await getNamedAccounts()).deployer

        raffle = await ethers.getContract('Raffle')
        ticketPrice = (await raffle.getTicketPrice()).toString()
        interval = (await raffle.getInterval()).toString()
        vrfCoordinatorV2_5Mock = await ethers.getContract('VRFCoordinatorV2_5Mock')
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

        it('does not allow entrance when raffle is calculating', async () => {
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

        it('returns false if raffle is not open', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])
          await raffle.performUpkeep('0x')

          const raffleState = await raffle.getRaffleState()
          expect(raffleState.toString()).to.equal('1')

          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')

          expect(upkeepNeeded).to.equal(false)
        })

        it('returns false if not enough time has passed', async () => {
          await raffle.enter({ value: ticketPrice })

          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')

          expect(upkeepNeeded).to.equal(false)
        })

        it('returns true if enough time has passed, has players and is open', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])

          const raffleState = await raffle.getRaffleState()
          expect(raffleState.toString()).to.equal('0')

          const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')

          expect(upkeepNeeded).to.equal(true)
        })
      })

      describe('performUpkeep', () => {
        it('can only run if upkeepNeeded is true', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])

          const tx = await raffle.performUpkeep('0x')

          await expect(tx).to.emit(raffle, 'RequestedRaffleWinner')
        })

        it('should revert if not enough time has passed', async () => {
          await raffle.enter({ value: ticketPrice })

          const balance = await ethers.provider.getBalance(raffle)
          const playersCount = await raffle.getNumberOfPlayers()
          const raffleState = await raffle.getRaffleState()

          const tx = raffle.performUpkeep('0x')

          await expect(tx)
            .to.be.revertedWithCustomError(raffle, 'Raffle__UpkeepNotNeeded')
            .withArgs(balance, playersCount, raffleState)
        })

        it('should request a random number', async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])

          const txResponse = await raffle.performUpkeep('0x')
          const txReceipt = await txResponse.wait(1)

          const event = txReceipt?.logs.find((log) => (log as EventLog).fragment?.name === 'RequestedRaffleWinner') as
            | EventLog
            | undefined

          const requestId = event?.args?.requestId
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(requestId > 0).to.be.true
        })
      })

      describe('fulfillRandomWords', () => {
        beforeEach(async () => {
          await raffle.enter({ value: ticketPrice })
          await network.provider.send('evm_increaseTime', [Number(interval) + 1])
          await network.provider.send('evm_mine', [])
        })

        it('can only be called after performUpkeep', async () => {
          await expect(
            vrfCoordinatorV2_5Mock.fulfillRandomWords(0, await raffle.getAddress())
          ).to.be.revertedWithCustomError(vrfCoordinatorV2_5Mock, 'InvalidRequest')
        })

        it('picks a winner, resets the raffle and sends the prize', async () => {
          const additionalEntrants = 3
          const startingAccountIndex = 1

          const accounts = await ethers.getSigners()

          for (
            let currentAccountIndex = startingAccountIndex;
            currentAccountIndex < startingAccountIndex + additionalEntrants;
            currentAccountIndex++
          ) {
            const account = accounts[currentAccountIndex]
            await raffle.connect(account).enter({ value: ticketPrice })
          }

          const startingTimestamp = await raffle.getLatestTimestamp()

          const winnerPromise = new Promise<string>((resolve, reject) => {
            raffle.once(raffle.filters.WinnerPicked, (winnerAddress) => {
              console.log('---winnerAddress', winnerAddress)
              try {
                resolve(winnerAddress)
              } catch (error) {
                reject(error)
              }
            })
          })

          const tx = await raffle.performUpkeep('0x')
          const txReceipt = await tx.wait(1)

          const event = txReceipt?.logs.find((log) => (log as EventLog).fragment?.name === 'RequestedRaffleWinner') as
            | EventLog
            | undefined

          const requestId = event?.args?.requestId

          await vrfCoordinatorV2_5Mock.fulfillRandomWords(requestId, await raffle.getAddress())

          const winner = await winnerPromise

          const recentWinner = await raffle.getRecentWinner()
          const raffleState = await raffle.getRaffleState()
          const latestTimestamp = await raffle.getLatestTimestamp()
          const playersCount = await raffle.getNumberOfPlayers()

          expect(recentWinner).to.equal(winner)
          expect(raffleState.toString()).to.equal('0')
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(latestTimestamp > startingTimestamp).to.be.true
          expect(playersCount.toString()).to.equal('0')
        })
      })
    })
