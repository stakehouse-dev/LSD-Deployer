import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

import { NodeRunnersQuery } from '@/graphql/queries/NodeRunners'

import { useLSDNetworkList } from '.'

export const useLsdValidators = (address: string) => {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [lsdNetworkBalance, setLsdNetworkBalance] = useState<any>({})
  const [validators, setValidators] = useState<string[]>([])
  const [isRefetch, setIsRefetch] = useState<boolean>(false)
  const { list } = useLSDNetworkList()

  const { data, loading: validatorsLoading } = useQuery(NodeRunnersQuery, {
    variables: { account: address.toLowerCase() },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    skip: !address
  })

  useEffect(() => {
    if (!validatorsLoading && data && list) {
      setLoading(true)

      let _lsdNetworkBalance: any = {},
        _validators: string[] = []

      list.map((item) => (_lsdNetworkBalance[item.liquidStakingManager] = 0))

      const _count = data.nodeRunners.reduce((prev: number, current: any) => {
        _lsdNetworkBalance[current.liquidStakingNetworks[0].liquidStakingManager] +=
          current.validators.length * 4

        return current.validators.length + prev
      }, 0)

      data.nodeRunners.map((item: any) =>
        item.validators.map((validator: any) => _validators.push(validator.id))
      )

      setValidators(_validators)
      setLsdNetworkBalance(_lsdNetworkBalance)
      setCount(_count)
      setLoading(false)
    }
  }, [validatorsLoading, data, list, isRefetch])

  const refetch = () => setIsRefetch(!isRefetch)

  return { count, validators, lsdNetworkBalance, loading: loading || validatorsLoading, refetch }
}
