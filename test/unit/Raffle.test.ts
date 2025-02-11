import { ethers, getNamedAccounts, deployments } from 'hardhat'
import type { Raffle } from '../../typechain-types'
import { expect } from 'chai'

// const getAmount = (value: number) => ethers.parseEther(value.toString())

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
  })
})
