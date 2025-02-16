import hre from 'hardhat'

export const verify = async (contractAddress: string, args: any[]) => {
  console.log('Verifying contract...')

  try {
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    })
  } catch (error: any) {
    if (error?.message?.includes('already verified')) {
      console.log('Contract already verified')

      return
    }

    console.error('Failed to verify contract:', error)
  }
}
