import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'

import { ValidatorsByNetworkQuery } from '@/graphql/queries/NodeRunners'

export const useLsdValidatorsByNetwork = (address: string, network: string) => {
  const [loading, setLoading] = useState<boolean>(true)

  const [validators, setValidators] = useState<string[]>([])
  const [originValidators, setOriginValidators] = useState<any[]>([])

  const { data, loading: validatorsLoading } = useQuery(ValidatorsByNetworkQuery, {
    variables: { account: address.toLowerCase(), network: network },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    skip: !address || !network
  })

  useEffect(() => {
    if (!validatorsLoading && data) {
      setLoading(true)

      let _validators: string[] = []
      let _originValidators: any[] = []

      data.nodeRunners.map((item: any) =>
        item.validators.map((validator: any) => _validators.push(validator.id))
      )

      data.nodeRunners.forEach((item: any) => {
        item.validators.forEach((validator: any) => _originValidators.push(validator))
      })

      setValidators(_validators)
      setOriginValidators(_originValidators)
      setLoading(false)
    }
  }, [validatorsLoading, data, address, network])

  return { validators, originValidators, loading: loading || validatorsLoading }
}
