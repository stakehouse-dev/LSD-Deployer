import { ethers } from 'ethers'
import { useCallback, useState } from 'react'
import { useAccount } from 'wagmi'

import { WITHDRAW_MODE } from '@/constants'
import { notifyHash } from '@/utils/global'

import { useSDK } from './'

export const useClaimMethod = () => {
  const { sdk } = useSDK()
  const { data: account } = useAccount()

  const [isLoading, setLoading] = useState(false)

  const handleClaim = useCallback(
    async (
      mode: WITHDRAW_MODE,
      amount: number,
      liquidStakingManager?: string | number,
      blsPublicKeys?: string[]
    ) => {
      setLoading(true)

      let result, lsmContractInstance
      switch (mode) {
        case WITHDRAW_MODE.STAKING:
          result = await sdk?.wizard.claimProtectedStakingRewards(
            account?.address,
            ethers.utils.parseEther(`${amount}`)
          )
          break
        case WITHDRAW_MODE.FEES_MEV:
          result = await sdk?.wizard.claimFeesAndMevRewards(
            account?.address,
            ethers.utils.parseEther(`${amount}`)
          )
          break
        case WITHDRAW_MODE.NODE_OPERATOR:
          lsmContractInstance = (await sdk?.contractInstance).liquidStakingManager(
            liquidStakingManager
          )

          result = await lsmContractInstance.claimRewardsAsNodeRunner(
            account?.address,
            blsPublicKeys
          )
          break
      }

      notifyHash(result.hash)
      await result.wait()
      setLoading(false)
      return result
    },
    [sdk]
  )

  return { handleClaim, isLoading, setLoading }
}
