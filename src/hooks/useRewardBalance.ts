import { useQuery } from '@apollo/client'
import { formatEther } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { WITHDRAW_MODE } from '@/constants'
import { GiantSavETHPoolQuery } from '@/graphql/queries/GiantSavETHPoolQuery'
import { LSDNetworksQuery } from '@/graphql/queries/LSDNetworks'
import { SmartWalletQuery } from '@/graphql/queries/NodeRunners'
import { roundNumber } from '@/utils/global'
import { getProtectedStakingRewardsBalance } from '@/utils/reward'

import { useSDK } from '.'

export const useRewardBalance = (mode: WITHDRAW_MODE, liquidStakingManager?: string | number) => {
  const { sdk } = useSDK()
  const { data: account } = useAccount()
  const [balance, setBalance] = useState<string>('0.0')
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefetch, setIsRefetch] = useState<boolean>(false)
  const [isEligible, setEligible] = useState(true)

  const { data, loading: networkLoading } = useQuery(LSDNetworksQuery, {
    variables: {
      liquidStakingManager: liquidStakingManager
    }
  })
  const { data: giantSavETHData } = useQuery(GiantSavETHPoolQuery)

  const { data: smartWalletData, loading: smartWalletLoading } = useQuery(SmartWalletQuery, {
    variables: {
      account: account?.address?.toLowerCase(),
      network: liquidStakingManager
    },
    skip: !account?.address
  })

  useEffect(() => {
    const fetchEligibility = async () => {
      if (sdk && account && mode === WITHDRAW_MODE.STAKING && giantSavETHData) {
        const giantProtectedStakingLPTokenAddress =
          giantSavETHData.giantSavETHPools[0]?.giantLPToken
        const timestamp = await sdk.wizard.getLastInteractedTimestamp(
          account.address,
          giantProtectedStakingLPTokenAddress
        )
        const isEligible = await sdk.wizard.isEligibleToInteractWithGiantLPToken(timestamp)

        if (!isEligible) {
          setEligible(false)
        }
      }
    }

    fetchEligibility()
  }, [sdk, account, giantSavETHData, mode])

  useEffect(() => {
    const initBalance = async () => {
      setLoading(true)

      let _balance,
        syndicateAddress,
        smartWallet = null

      if (mode === WITHDRAW_MODE.NODE_OPERATOR) {
        syndicateAddress = data.liquidStakingNetworks[0].feeRecipientAndSyndicate
        if (smartWalletData.nodeRunners.length > 0)
          smartWallet = smartWalletData.nodeRunners[0].smartWallets[0].id
      }

      switch (mode) {
        case WITHDRAW_MODE.STAKING:
          _balance = await getProtectedStakingRewardsBalance(sdk, account?.address ?? '')
          setBalance(formatEther(_balance))
          break
        case WITHDRAW_MODE.FEES_MEV:
          _balance = await sdk?.wizard.previewFeesAndMevRewards(account?.address ?? '')
          setBalance(roundNumber(Number(formatEther(_balance)), 3))
          break

        case WITHDRAW_MODE.NODE_OPERATOR:
          if (smartWallet) {
            _balance = await sdk?.wizard.previewNodeOperatorRewards(
              syndicateAddress,
              liquidStakingManager,
              account?.address,
              smartWallet
            )

            setBalance(formatEther(_balance))
          } else setBalance('0.0')
          break

        default:
          break
      }

      setLoading(false)
    }

    if (mode !== WITHDRAW_MODE.NODE_OPERATOR && sdk && !networkLoading && !smartWalletLoading)
      initBalance()

    if (
      mode === WITHDRAW_MODE.NODE_OPERATOR &&
      sdk &&
      data &&
      smartWalletData &&
      !networkLoading &&
      !smartWalletLoading
    )
      initBalance()
  }, [sdk, isRefetch, data, networkLoading, smartWalletLoading, smartWalletData])

  const refetch = () => setIsRefetch(!isRefetch)
  return { balance, isEligible, loading, refetch }
}
