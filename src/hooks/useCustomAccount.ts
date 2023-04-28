import { useContext } from 'react'

import { UserContext } from '@/context/UserContext'

export const useCustomAccount = () => {
  const data = useContext(UserContext)
  return data
}
