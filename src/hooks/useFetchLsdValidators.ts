import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { LsdValidatorsQuery } from '@/graphql/queries/lsdValidators'
import { AllNodeRunnersQuery } from '@/graphql/queries/NodeRunnersQuery'
import { TLSDNetwork, TLSDValidator } from '@/types'

export const useFetchLsdValidators = () => {
  const [validators, setValidators] = useState<TLSDValidator[]>([])
  const [networks, setNetworks] = useState<TLSDNetwork[]>([])

  const { data: account } = useAccount()

  const { data: nodeRunners, refetch: refetchNodeRunners } = useQuery(AllNodeRunnersQuery, {
    variables: {
      address: account?.address?.toLowerCase()
    },
    skip: !account?.address,
    fetchPolicy: 'network-only'
  })

  const handleRefresh = () => {
    refetchNodeRunners()
  }

  useEffect(() => {
    if (nodeRunners && nodeRunners.nodeRunners[0]) {
      setValidators(nodeRunners.nodeRunners[0].validators)
      setNetworks(nodeRunners.nodeRunners[0].liquidStakingNetworks)
    } else {
      setValidators([])
    }
  }, [nodeRunners])

  return { validators, networks, handleRefresh }
}
