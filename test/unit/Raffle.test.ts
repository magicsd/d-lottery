import { ethers, getNamedAccounts, deployments } from 'hardhat'
import type { Raffle } from '../../typechain-types'
import { expect } from 'chai'

const getAmount = (value: number) => ethers.parseEther(value.toString())

describe('Raffle', async () => {
  let raffle: Raffle
  let deployer: string

  beforeEach(async () => {
    await deployments.fixture('all')

    deployer = (await getNamedAccounts()).deployer

    raffle = await ethers.getContract('Raffle', deployer)
  })

  describe('enter', async () => {
    it('reverts if not enough value sent', async () => {
      const tx = raffle.enter()

      await expect(tx).to.be.revertedWithCustomError(raffle, 'Raffle__NotEnoughValueEntered')
    })

    it('adds account to players array', async () => {
      const txResponse = await raffle.enter({ value: getAmount(1) })

      await txResponse.wait(1)

      const player = await raffle.getPlayer(0)

      expect(player).to.equal(deployer)
    })

    it('emits Enter when account enters', async () => {
      const tx = raffle.enter({ value: getAmount(1) })

      await expect(tx).to.emit(raffle, 'Enter').withArgs(deployer)
    })
  })
})
