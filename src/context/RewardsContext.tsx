import { createContext, FC, PropsWithChildren } from 'react'

import { useTotalRewardBalance } from '../hooks'

interface IContextProps {
  balance: any
  rewards: any
  isEligible: boolean
  loading: boolean
  refetch: () => void
}

export const RewardsContext = createContext<IContextProps>({
  balance: 0,
  isEligible: true,
  loading: false,
  rewards: null,
  refetch: () => {}
})

export const RewardsProvider: FC<PropsWithChildren> = ({ children }) => {
  const { balance, isEligible, loading, refetch, rewards } = useTotalRewardBalance()

  return (
    <RewardsContext.Provider
      value={{
        balance,
        isEligible,
        loading,
        refetch,
        rewards
      }}>
      {children}
    </RewardsContext.Provider>
  )
}
