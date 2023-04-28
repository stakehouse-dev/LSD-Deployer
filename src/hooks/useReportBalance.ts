import { useState } from 'react'

import { BEACON_NODE_URL } from '@/constants/chains'
import { BalanceReportT } from '@/types'
import { noty } from '@/utils/global'

import { useSDK } from './useSDK'

export const useReportBalance = () => {
  const [isSubmitting, setSubmitting] = useState(false)
  const [isSubmitted, setSubmitted] = useState(false)
  const [signature, setSignature] = useState<BalanceReportT>()

  const { sdk } = useSDK()

  const handleReset = () => {
    setSubmitted(false)
    setSubmitting(false)
    setSignature(undefined)
  }

  const handleSubmit = async (blsPublicKey: string) => {
    if (!sdk) {
      return
    }

    try {
      setSubmitting(true)
      const finalisedEpochReport = await sdk.balanceReport.getFinalisedEpochReport(
        BEACON_NODE_URL,
        blsPublicKey
      )
      const authenticateReportResult: BalanceReportT = await sdk.balanceReport.authenticateReport(
        BEACON_NODE_URL,
        finalisedEpochReport
      )
      if (!authenticateReportResult?.report) {
        setSubmitted(false)
        noty((authenticateReportResult as any).message || authenticateReportResult)
      } else {
        setSignature(authenticateReportResult)
        setSubmitted(true)
      }
    } catch (err: any) {
      console.log('err: ', err)
      noty(err.message || err)
    }

    setSubmitting(false)
  }
  return { handleSubmit, handleReset, isSubmitting, isSubmitted, signature }
}
