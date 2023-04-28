import { useQuery } from '@apollo/client'
import { BigNumber } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import client from '@/graphql/client'
import { GiantSavETHPoolQuery } from '@/graphql/queries/GiantSavETHPoolQuery'
import { LSDNetworksQuery } from '@/graphql/queries/LSDNetworks'
import { SmartWalletQuery } from '@/graphql/queries/NodeRunners'
import { TLSDNetwork } from '@/types'
import { roundNumber } from '@/utils/global'
import { getFeesMevRewardsBalance, getProtectedStakingRewardsBalance } from '@/utils/reward'

import { useLSDNetworkList, useSDK } from '.'

export const useTotalRewardBalance = () => {
  const { sdk } = useSDK()
  const { data: account } = useAccount()
  const [balance, setBalance] = useState<any>(0)
  const [rewards, setRewards] = useState<any>()
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefetch, setIsRefetch] = useState<boolean>(false)
  const [isEligible, setEligible] = useState(true)

  const { list } = useLSDNetworkList()
  const { data: giantSavETHData } = useQuery(GiantSavETHPoolQuery)

  useEffect(() => {
    const fetchEligibility = async () => {
      if (sdk && account && giantSavETHData) {
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
  }, [sdk, account, giantSavETHData])

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let rewardResult: any = {}
      // get eligibe ability
      const giantProtectedStakingLPTokenAddress = giantSavETHData.giantSavETHPools[0]?.giantLPToken
      const timestamp = await sdk!.wizard.getLastInteractedTimestamp(
        account!.address,
        giantProtectedStakingLPTokenAddress
      )
      const isEligible = await sdk!.wizard.isEligibleToInteractWithGiantLPToken(timestamp)
      if (!isEligible) {
        setEligible(false)
      }

      const stakingBalance = await getProtectedStakingRewardsBalance(sdk, account?.address ?? '')
      const feesMevBalance = await sdk?.wizard.previewFeesAndMevRewards(account?.address ?? '')
      rewardResult = {
        staking: isEligible ? Number(formatEther(stakingBalance)) : 0,
        feesMev: Number(formatEther(feesMevBalance))
      }

      let nodeOperatorBalance: any = {}
      let totalNodeOperatorBalance = 0

      await Promise.all(
        list.map(async (network: TLSDNetwork) => {
          const { data } = await client.query({
            query: LSDNetworksQuery,
            variables: {
              liquidStakingManager: network.liquidStakingManager
            }
          })

          const { data: smartWalletData } = await client.query({
            query: SmartWalletQuery,
            variables: {
              account: account?.address?.toLowerCase(),
              network: network.liquidStakingManager
            }
          })

          const syndicateAddress = data.liquidStakingNetworks[0].feeRecipientAndSyndicate

          let smartWallet = null
          if (smartWalletData.nodeRunners.length > 0)
            smartWallet = smartWalletData.nodeRunners[0].smartWallets[0].id

          if (smartWallet) {
            const _balance = await sdk?.wizard.previewNodeOperatorRewards(
              syndicateAddress,
              network.liquidStakingManager,
              account?.address,
              smartWallet
            )

            nodeOperatorBalance[network.liquidStakingManager] = Number(formatEther(_balance))
            totalNodeOperatorBalance += Number(formatEther(_balance))
          }
        })
      )

      rewardResult = {
        ...rewardResult,
        nodeOperator: nodeOperatorBalance
      }

      setRewards(rewardResult)
      setBalance(rewardResult.staking + rewardResult.feesMev + totalNodeOperatorBalance)

      setLoading(false)
    }

    if (sdk && list.length > 0 && giantSavETHData && account) fetch()
  }, [list, sdk, isRefetch, account, giantSavETHData])

  const refetch = () => setIsRefetch(!isRefetch)
  return { balance, rewards, isEligible, loading, refetch }
}
