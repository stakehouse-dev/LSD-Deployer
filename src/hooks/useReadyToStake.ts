import { ethers } from 'ethers'
import { useCallback, useEffect, useState } from 'react'

import { TFunds } from '../types'
import { useSDK } from './useSDK'

export function useReadyToStake(blsPublicKey: string) {
  const { sdk } = useSDK()
  const [readyToStake, setReadyToStake] = useState<boolean>(false)
  const [funds, setFunds] = useState<TFunds>()
  const [isLoading, setLoading] = useState(false)

  const checkReadyToStake = useCallback(async () => {
    if (sdk && blsPublicKey) {
      setLoading(true)
      try {
        const liquidStakingManagerAddress = await sdk.wizard.getLSDNForBLSPublicKey(blsPublicKey)
        const isBanned = await sdk.wizard.isBLSPublicKeyBanned(
          liquidStakingManagerAddress,
          blsPublicKey
        )

        const funds = await sdk.wizard.calculateFundsRequiredForStaking(blsPublicKey)
        setFunds({
          savETH: Number(ethers.utils.formatEther(ethers.BigNumber.from(funds.savETH))),
          feesAndMEV: Number(ethers.utils.formatEther(ethers.BigNumber.from(funds.feesAndMEV)))
        })

        if (!isBanned) setReadyToStake(true)
      } catch (err) {
        console.log('isBanned error: ', err)
        setReadyToStake(false)
      }
      setLoading(false)
    }
  }, [sdk && blsPublicKey])

  useEffect(() => {
    checkReadyToStake()
  }, [checkReadyToStake])

  return { readyToStake, funds, isLoading, checkReadyToStake }
}
