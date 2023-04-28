import { useCallback, useState } from 'react'
import { useAccount, useConnect } from 'wagmi'

import { DepositObjectT, KeystoreT } from '../types'
import { useSDK } from './useSDK'

export const useStake = () => {
  const [isLoading, setLoading] = useState(false)

  const { sdk } = useSDK()
  const { data: account } = useAccount()
  const { activeConnector } = useConnect()

  const handleApproveStake = useCallback(
    async (password: string, keystore: KeystoreT) => {
      if (sdk && activeConnector) {
        const provider = await activeConnector.getProvider()
        setLoading(true)
        const depositData: DepositObjectT = await sdk.utils.getDepositDataFromKeystore(
          keystore,
          password
        )
        const [deposit] = depositData
        const lsManagerAddress = await sdk.wizard.getLSDNForBLSPublicKey(deposit.pubkey)
        const depositor_signature_payload = await sdk.utils.getPersonalSignInitials(
          provider,
          sdk.utils.add0x(deposit.pubkey),
          sdk.utils.add0x(deposit.signature),
          account?.address,
          activeConnector.name === 'WalletConnect'
        )
        const bls_authentication_response = await sdk.BLSAuthentication(
          password,
          keystore,
          depositData,
          depositor_signature_payload
        )
        const result = await sdk.wizard.stake(lsManagerAddress, bls_authentication_response)
        return result
      }
    },
    [sdk, activeConnector]
  )

  return { isLoading, handleApproveStake, setLoading }
}
