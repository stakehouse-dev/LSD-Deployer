import { useQuery } from '@apollo/client'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { GiantFeesAndMevPoolsQuery } from '@/graphql/queries/GiantFeesAndMevPoolsQuery'
import { GiantSavETHPoolQuery } from '@/graphql/queries/GiantSavETHPoolQuery'

import { NodeRunnersQuery } from '../graphql/queries/NodeRunnersQuery'

export function useInProgress(from: 'Node Runner' | 'Staking' | 'FeesMev' | 'Main') {
  // states
  const [amount, setAmount] = useState(0)

  // wagmi
  const { data: account } = useAccount()

  // apollo
  const { data: giantSavETHData } = useQuery(GiantSavETHPoolQuery)
  const { data: giantFeesAndMevData } = useQuery(GiantFeesAndMevPoolsQuery)
  const { data: nodeRunnersData } = useQuery(NodeRunnersQuery, {
    variables: { address: account?.address?.toLowerCase(), status: 'WAITING_FOR_ETH' }
  })

  useEffect(() => {
    if (giantFeesAndMevData && giantSavETHData) {
      try {
        const giantFeesAndMevAmount =
          giantFeesAndMevData.giantFeesAndMevPools[0]?.sentToLiquidStakingNetworks
        const giantSavETHAmount = giantSavETHData.giantSavETHPools[0]?.sentToLiquidStakingNetworks
        if (from === 'Main') {
          const result =
            Number(ethers.utils.formatEther(ethers.BigNumber.from(giantFeesAndMevAmount ?? 0))) +
            Number(ethers.utils.formatEther(ethers.BigNumber.from(giantSavETHAmount ?? 0)))
          setAmount(result)
        } else if (from === 'Staking') {
          const result = Number(
            ethers.utils.formatEther(ethers.BigNumber.from(giantSavETHAmount ?? 0))
          )
          setAmount(result)
        } else if (from === 'Node Runner') {
          const validators = nodeRunnersData.nodeRunners[0]?.validators
          if (validators && validators.length > 0) {
            setAmount(validators.length * 4)
          } else {
            setAmount(0)
          }
        } else {
          const result = Number(
            ethers.utils.formatEther(ethers.BigNumber.from(giantFeesAndMevAmount ?? 0))
          )
          setAmount(result)
        }
      } catch (err) {
        console.log('fetch in progress error: ', err)
      }
    }
  }, [giantSavETHData, giantFeesAndMevData, from])

  return { amount }
}
