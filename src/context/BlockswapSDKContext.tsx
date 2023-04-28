import { Wizard } from '@blockswaplab/lsd-wizard'
import { StakehouseSDK } from '@blockswaplab/stakehouse-sdk'
import { createContext, FC, PropsWithChildren, useEffect, useState } from 'react'
import { chain, useConnect, useNetwork, useSigner } from 'wagmi'

import { supportedChains } from '@/constants/chains'
import { config } from '@/constants/environment'
import { TStakehouseSDK, TStakehouseWizard } from '@/types'

interface IContextProps {
  sdk: TStakehouseSDK | null
  lsdWizard: TStakehouseWizard | null
}

const AUTOCONNECTED_CONNECTOR_IDS = ['safe']

function useAutoConnect() {
  const { connect, connectors } = useConnect()

  useEffect(() => {
    AUTOCONNECTED_CONNECTOR_IDS.forEach((connector) => {
      const connectorInstance = connectors.find((c) => c.id === connector && c.ready)

      if (connectorInstance) {
        connect({ connector: connectorInstance })
      }
    })
  }, [connect, connectors])
}

export const BlockswapSDKContext = createContext<IContextProps>({
  sdk: null,
  lsdWizard: null
})

const BlockswapSDKProvider: FC<PropsWithChildren> = ({ children }) => {
  const [sdk, setSDK] = useState<TStakehouseSDK | null>(null)
  const [lsdWizard, setLsdWizard] = useState<TStakehouseWizard | null>(null)
  const { data: signer } = useSigner()
  const { activeChain, chains, switchNetwork } = useNetwork()
  useAutoConnect()

  useEffect(() => {
    if (chains && activeChain) {
      let isSupprotedChain = false
      chains.forEach((chain) => {
        if (chain.id === activeChain.id) {
          isSupprotedChain = true
        }
      })
      if (!isSupprotedChain && switchNetwork) {
        switchNetwork(chains[0].id)
      }
    }
  }, [activeChain, chains, switchNetwork])

  useEffect(() => {
    if (signer && activeChain?.id === config.networkId) {
      try {
        console.log('signer: ', signer)
        const sdk = new StakehouseSDK(signer)
        setSDK(sdk)
        const lsdWizard = new Wizard({ signerOrProvider: signer })
        setLsdWizard(lsdWizard)
      } catch (err) {
        console.log('err: ', err)
      }
    }
  }, [signer, activeChain])

  return (
    <BlockswapSDKContext.Provider value={{ sdk, lsdWizard }}>
      {children}
    </BlockswapSDKContext.Provider>
  )
}

export default BlockswapSDKProvider
