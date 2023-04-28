import { useQuery } from '@apollo/client'
import { createContext, FC, PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useAccount, useConnect, useSigner } from 'wagmi'

import { AllLSDNetworksQuery } from '@/graphql/queries/LSDNetworks'
import { TLSDNetwork } from '@/types'

export interface UserContextProps {
  account: any
  isGnosis: boolean
  networkList: string[]
}

export const UserContext = createContext<UserContextProps>({
  account: undefined,
  isGnosis: false,
  networkList: []
})

const UserProvider: FC<PropsWithChildren> = ({ children }) => {
  const { activeConnector } = useConnect()
  const { data: account } = useAccount()
  const { data: signer } = useSigner()
  const [customAccount, setCustomAccount] = useState<any>()
  const [isGnosis, setIsGnosis] = useState<boolean>(false)

  const { data: { liquidStakingNetworks: list } = {}, loading: networksLoading } =
    useQuery(AllLSDNetworksQuery)

  useEffect(() => {
    const fetchAccount = async () => {
      if (activeConnector) {
        if (signer && activeConnector.id === 'safe') {
          setIsGnosis(true)
          const address = await signer.getAddress()
          setCustomAccount({ address })
        } else if (activeConnector.id !== 'safe') {
          setCustomAccount(account)
          setIsGnosis(false)
        }
      }
    }

    fetchAccount()
  }, [activeConnector])

  const networkList = useMemo<string[]>(() => {
    if (list) {
      return list.map((network: TLSDNetwork) => network.ticker.toLowerCase())
    }

    return []
  }, [list])

  return (
    <UserContext.Provider value={{ account: customAccount, isGnosis, networkList }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
