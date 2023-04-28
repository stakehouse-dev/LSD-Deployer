import { ethers } from 'ethers'
import { useCallback, useState } from 'react'

import { notifyHash } from '@/utils/global'

import { useSDK } from './useSDK'

export const useDepositNodeRunner = () => {
  const { sdk } = useSDK()
  const [isLoading, setLoading] = useState(false)

  const handleDeposit = useCallback(
    async (
      networkId: string,
      blsPublicKey: string,
      blsSignature: string,
      eoaRepresentative: string
    ) => {
      if (sdk) {
        const ethAmount = ethers.utils.parseEther('4.0')
        setLoading(true)
        const result = await sdk.wizard.depositETHByNodeRunner(
          networkId,
          blsPublicKey,
          blsSignature,
          eoaRepresentative,
          ethAmount
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
