import { useContext } from 'react'

import { BlockswapSDKContext } from '@/context/BlockswapSDKContext'

export function useSDK() {
  const { sdk, lsdWizard } = useContext(BlockswapSDKContext)

  return {
    sdk,
    lsdWizard
  }
}
