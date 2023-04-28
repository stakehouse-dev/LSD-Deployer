import { useState } from 'react'

import { BalanceReportT } from '@/types'
import { handleErr, notifyHash, noty } from '@/utils/global'

import { useSDK } from './useSDK'

export const useMint = () => {
  const [isSubmitting, setSubmitting] = useState(false)

  const { sdk } = useSDK()

  const handleMint = async (blsPublicKey: string, signature: BalanceReportT) => {
    if (!sdk) return

    setSubmitting(true)
    const lsManagerAddress = await sdk.wizard.getLSDNForBLSPublicKey(blsPublicKey)
    const liquidStakingManager = (await sdk.contractInstance).liquidStakingManager(lsManagerAddress)
    const { deadline, r, report, s, v } = signature
    const tx = await liquidStakingManager.mintDerivatives(
      [sdk.utils.add0x(blsPublicKey)],
      [
        {
          ...report,
          blsPublicKey: sdk.utils.add0x(report.blsPublicKey),
          withdrawalCredentials: sdk.utils.add0x(report.withdrawalCredentials)
        }
      ],
      [
        {
          deadline: deadline,
          v: v,
          r: sdk.utils.add0x(r),
          s: sdk.utils.add0x(s)
        }
      ]
    )
    notifyHash(tx.hash)
    await tx.wait()
    setSubmitting(false)
    return tx
  }
  return { handleMint, isSubmitting }
}
