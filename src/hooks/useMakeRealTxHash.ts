import EthersAdapter from '@safe-global/safe-ethers-lib'
import SafeServiceClient from '@safe-global/safe-service-client'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { useSigner } from 'wagmi'

import { useCustomAccount } from './useCustomAccount'

export const useMakeRealTxHash = (txHash: string) => {
  const [hash, setHash] = useState('')

  const { data: signer } = useSigner()
  const { isGnosis } = useCustomAccount()

  useEffect(() => {
    const fetchRealTxHash = async () => {
      if (txHash && signer) {
        if (isGnosis) {
          const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer
          })
          const safeService = new SafeServiceClient({
            txServiceUrl: 'https://safe-transaction-goerli.safe.global',
            ethAdapter
          })
          const tx = await safeService.getTransaction(txHash)
          setHash(tx.transactionHash)
        } else {
          setHash(txHash)
        }
      }
    }

    fetchRealTxHash()
  }, [txHash, isGnosis])

  return { hash }
}
