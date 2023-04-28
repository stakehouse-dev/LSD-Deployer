import { ethers } from 'ethers'
import { useCallback, useState } from 'react'
import { useAccount } from 'wagmi'

import { WITHDRAW_MODE } from '@/constants'
import { notifyHash } from '@/utils/global'

import { useSDK } from '.'

export const useWithdrawMethod = () => {
  const { sdk } = useSDK()
  const { data: account } = useAccount()

  const [isLoading, setLoading] = useState(false)

  const handleWithdraw = useCallback(
    async (
      mode: WITHDRAW_MODE,
      amount: number,
      liquidStakingManagerAddress?: string | number,
      blsPublicKey?: string | number
    ) => {
      setLoading(true)
      let pool = undefined,
        liquidStakingManager = undefined
      switch (mode) {
        case WITHDRAW_MODE.STAKING:
          pool = (await sdk?.contractInstance).giantSavETHPool()
          break
        case WITHDRAW_MODE.FEES_MEV:
          pool = (await sdk?.contractInstance).giantFeesAndMEV()
          break
        case WITHDRAW_MODE.NODE_OPERATOR:
          liquidStakingManager = (await sdk?.contractInstance).liquidStakingManager(
            liquidStakingManagerAddress
          )
          break
      }
      let result
      if (mode === WITHDRAW_MODE.NODE_OPERATOR)
        result = await liquidStakingManager.withdrawETHForKnot(account?.address, blsPublicKey)
      else result = await pool.withdrawETH(ethers.utils.parseEther(`${amount}`))

      notifyHash(result.hash)
      await result.wait()
      setLoading(false)
      return result
    },
    [sdk]
  )

  return { handleWithdraw, isLoading, setLoading }
}
