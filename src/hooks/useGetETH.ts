import { ethers } from 'ethers'
import { useCallback, useState } from 'react'

import { useSDK } from './useSDK'

export const useGetETH = () => {
  const { sdk } = useSDK()
  const [isLoading, setLoading] = useState(false)

  const handleGetSavETH = useCallback(
    async (blsPublicKey: string, funds: number) => {
      if (sdk) {
        setLoading(true)
        let lsManagerAddress
        try {
          lsManagerAddress = await sdk.wizard.getLSDNForBLSPublicKey(blsPublicKey)
          let tx = await sdk.wizard.rotateFundsBackToGiantProtectedStakingPool()
          await tx.wait()
        } catch (err) {
          console.log('rotateFundsBackToGiantProtectedStakingPool error---------')
          console.log(err)
        }
        try {
          const result = await sdk.wizard.fundNodeOperatorFromGiantSavETHPool(
            lsManagerAddress,
            blsPublicKey,
            ethers.utils.parseEther(`${funds}`)
          )
          return result
        } catch (err) {
          console.log('get saveth error---------')
          console.log(err)
          return null
        }
      }
    },
    [sdk]
  )

  const handleGetFeesMevETH = useCallback(
    async (blsPublicKey: string, funds: number) => {
      if (sdk) {
        setLoading(true)
        let lsManagerAddress
        try {
          lsManagerAddress = await sdk.wizard.getLSDNForBLSPublicKey(blsPublicKey)
          let tx = await sdk.wizard.rotateFundsBackToGiantFeesAndMevPool()
          await tx.wait()
        } catch (err) {
          console.log('get feesMevEth error---------')
          console.log(err)
        }

        try {
          const result = await sdk.wizard.fundNodeOperatorFromGiantFeesAndMevPool(
            lsManagerAddress,
            blsPublicKey,
            ethers.utils.parseEther(`${funds}`)
          )
          return result
        } catch (err) {
          console.log('get feesMevEth error---------')
          console.log(err)
          return null
        }
      }
    },
    [sdk]
  )

  return { handleGetFeesMevETH, handleGetSavETH, setLoading, isLoading }
}
