import { useQuery } from '@apollo/client'
import { ethers } from 'ethers'
import { useCallback, useState } from 'react'

import { notifyHash } from '@/utils/global'

import { useSDK } from './useSDK'

export const useDepositProtectedStaking = () => {
  const { sdk } = useSDK()
  const [isLoading, setLoading] = useState(false)

  const handleDeposit = useCallback(
    async (amount: number) => {
      if (sdk) {
        setLoading(true)
        const result = await sdk.wizard.depositETHForProtectedStaking(
          ethers.utils.parseEther(`${amount}`)
        )
        notifyHash(result.hash)
        await result.wait()
        setLoading(false)
        return result
      }
    },
    [sdk]
  )

  return { handleDeposit, isLoading, setLoading }
}
