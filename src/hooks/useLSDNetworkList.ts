import { useCallback, useEffect, useState } from 'react'

import { TLSDNetwork } from '../types'
import { useSDK } from './useSDK'

export function useLSDNetworkList() {
  const { sdk } = useSDK()
  const [list, setList] = useState<TLSDNetwork[]>([])

  const fetchLSDNetworkList = useCallback(async () => {
    if (sdk) {
      const list = await sdk.wizard.getListOfLSDNetworks()
      setList(list as TLSDNetwork[])
    }
  }, [sdk])

  useEffect(() => {
    fetchLSDNetworkList()
  }, [fetchLSDNetworkList])

  return { list, fetchLSDNetworkList }
}
