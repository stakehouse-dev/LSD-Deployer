import './App.css'

import { ApolloProvider } from '@apollo/client'
import { SafeConnector } from '@gnosis.pm/safe-apps-wagmi'
import { Buffer } from 'buffer'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { IntercomProvider } from 'react-use-intercom'
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { infuraProvider } from 'wagmi/providers/infura'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

import { LayoutDashboard } from '@/components/layouts'
import { rpcUrls, supportedChains } from '@/constants/chains'
import BlockswapSDKProvider from '@/context/BlockswapSDKContext'
import GraphqlProvider from '@/context/GraphqlContext'
import GraphqlClient from '@/graphql/client'
import { Home, Manage, WalletConnect } from '@/views'

import UserProvider from './context/UserContext'

if (!window.Buffer) {
  window.Buffer = Buffer
}

const { provider } = configureChains(
  [chain.goerli],
  [
    infuraProvider({ infuraId: '915a003951aa43ecb073a92a70e9e445' }),
    jsonRpcProvider({
      rpc: (chain) => {
        return { http: rpcUrls[chain.id] }
      }
    })
  ]
)

const client = createClient({
  autoConnect: false,
  connectors({ chainId }) {
    const currentChain = supportedChains.find((chain) => chain.id === chainId) ?? chain.goerli
    const rpcUrl = rpcUrls[currentChain.id]

    return [
      new InjectedConnector({ chains: supportedChains }),
      new WalletConnectConnector({
        chains: supportedChains,
        options: {
          qrcode: true,
          rpc: { [currentChain.id]: rpcUrl }
        }
      }),
      new SafeConnector({ chains: supportedChains })
    ]
  },
  provider
})

function App() {
  return (
    <IntercomProvider appId="xg5qffph" apiBase="https://api-iam.intercom.io" autoBoot>
      <WagmiConfig client={client}>
        <ApolloProvider client={GraphqlClient}>
          <UserProvider>
            <BlockswapSDKProvider>
              <GraphqlProvider>
                <Router>
                  <Routes>
                    <Route path="/" element={<LayoutDashboard />}>
                      <Route path="sign-in" element={<WalletConnect />} />
                      <Route path="manage" element={<Manage />} />
                      <Route index element={<Home />} />
                    </Route>
                  </Routes>
                </Router>
              </GraphqlProvider>
            </BlockswapSDKProvider>
          </UserProvider>
        </ApolloProvider>
      </WagmiConfig>
    </IntercomProvider>
  )
}

export default App
