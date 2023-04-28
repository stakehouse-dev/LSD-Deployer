import { formatEther, parseEther } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { WITHDRAW_MODE } from '@/constants'
import { getFeesMevBalance, getProtectedStakingBalance } from '@/utils/withdraw'

import { useLsdValidators, useSDK } from '.'

export const useWithdrawBalance = (mode?: WITHDRAW_MODE) => {
  const { sdk } = useSDK()
  const { data: account } = useAccount()
  const [balance, setBalance] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefetch, setIsRefetch] = useState<boolean>(false)

  const { count, loading: validatorLoading } = useLsdValidators(account?.address ?? '')

  useEffect(() => {
    const initBalance = async () => {
      setLoading(true)
      let stakingBalance, feesMevBalance, nodeOperatorBalance, totalBalance

      switch (mode) {
        case WITHDRAW_MODE.STAKING:
          stakingBalance = await getProtectedStakingBalance(sdk, account?.address ?? '')
          setBalance(formatEther(stakingBalance))
          break

        case WITHDRAW_MODE.FEES_MEV:
          feesMevBalance = await getFeesMevBalance(sdk, account?.address ?? '')
          setBalance(formatEther(feesMevBalance))
          break

        case WITHDRAW_MODE.NODE_OPERATOR:
          nodeOperatorBalance = parseEther(Number(count * 4).toString())
          setBalance(formatEther(nodeOperatorBalance))
          break

        default:
          stakingBalance = await getProtectedStakingBalance(sdk, account?.address ?? '')
          feesMevBalance = await getFeesMevBalance(sdk, account?.address ?? '')
          nodeOperatorBalance = parseEther(Number(count * 4).toString())
          totalBalance = stakingBalance.add(feesMevBalance).add(nodeOperatorBalance)
          setBalance(formatEther(totalBalance))
          break
      }

      setLoading(false)
    }

    if (sdk && account?.address && !validatorLoading) initBalance()
  }, [sdk, validatorLoading, isRefetch])

  const refetch = () => setIsRefetch(!isRefetch)
  return { balance, loading, refetch }
}
