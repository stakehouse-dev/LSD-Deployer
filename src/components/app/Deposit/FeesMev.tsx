import './stake.scss'

import { FC, useMemo, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'

import ArrowLeftSVG from '@/assets/images/arrow-left.svg'
import { Button, CompletedTxView, ErrorModal, LoadingModal, ModalDialog } from '@/components/shared'
import { MAX_GAS_FEE } from '@/constants'
import { config } from '@/constants/environment'
import { useDepositFeesAndMev, useNetworkBasedLinkFactories } from '@/hooks'
import { changeInput, handleErr, roundNumber } from '@/utils/global'

import { DepositFooter } from './Footer'

type FeesMevProps = {
  onBack: () => void
}

const MIN_AMOUNT = 0.001
export const FeesMev: FC<FeesMevProps> = ({ onBack }) => {
  // states
  const [amount, setAmount] = useState<string>('')
  const [txResult, setTxResult] = useState<any>()
  const [failed, setFailed] = useState<string>('')

  // custom hooks
  const { handleDeposit, isLoading, setLoading } = useDepositFeesAndMev()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()

  // wagmi hooks
  const { data: account } = useAccount()
  const { data: { formatted: MAX_AMOUNT } = {} } = useBalance({
    addressOrName: account?.address,
    formatUnits: 'ether',
    chainId: config.networkId
  })

  const errMessage = useMemo(() => {
    if (!MAX_AMOUNT || amount === '') return ''

    if (Number(MAX_AMOUNT) < 0.001 || Number(amount) > Number(MAX_AMOUNT)) {
      return 'Insufficient Balance'
    }

    if (Number(amount) < Number(MIN_AMOUNT)) {
      return 'Amount should be greater than 0.001'
    }

    return ''
  }, [MAX_AMOUNT, amount])

  const handleSetMaxAmount = () => {
    setAmount(MAX_AMOUNT ? `${roundNumber(Number(MAX_AMOUNT) - MAX_GAS_FEE, 3)}` : '')
  }

  const handleDepositEth = async () => {
    try {
      const txResult = await handleDeposit(Number(amount))
      setTimeout(() => {
        setTxResult(txResult)
      }, 500)
    } catch (err: any) {
      console.log('deposit fees Mev error-----------------')
      console.log(err, err.message)
      setLoading(false)
      setTimeout(() => {
        setFailed(handleErr(err))
      }, 500)
    }
  }

  const handleCloseSuccessModal = () => {
    setTxResult(undefined)
    setAmount('')
    onBack()
  }

  return (
    <div className="content protected-staking">
      <div className="content__box">
        <div className="content__box__title">
          <img src={ArrowLeftSVG} className="icon-left-arrow" onClick={onBack} />
          Fees and MEV
        </div>
        <div className="content__box__deposit">
          <div className="text-base">Deposit ETH</div>
          <div className="content__box__deposit__input">
            <input
              value={amount}
              placeholder="Amount"
              onChange={(e) => {
                if (!isNaN(Number(e.target.value))) {
                  setAmount(changeInput(e.target.value))
                }
              }}
              className="text-xl text-grey25 bg-black outline-none"
            />
            <div className="content__box__deposit__input__max">
              <span>ETH</span>
              {roundNumber(Number(MAX_AMOUNT) - MAX_GAS_FEE, 3) !==
                roundNumber(Number(amount), 3) && (
                <button onClick={handleSetMaxAmount}>
                  <p className="text-xs font-medium text-primary700">MAX</p>
                </button>
              )}
            </div>
          </div>
          <div className="content__box__deposit__balance">
            <span className="text-error">{errMessage}</span>
            <span>Balance: {roundNumber(Number(MAX_AMOUNT), 3)} ETH</span>
          </div>
          <Button size="lg" disabled={!amount || !!errMessage} onClick={handleDepositEth}>
            Confirm
          </Button>
        </div>
      </div>
      <DepositFooter from="FeesMev" />
      <LoadingModal open={isLoading} title="Confirmation Pending" onClose={() => {}} />
      <ErrorModal
        open={!!failed}
        onClose={() => setFailed('')}
        title="Deposit Failed"
        message={failed}
        actionButtonContent="Try Again"
        onAction={() => setFailed('')}
      />
      <ModalDialog open={!!txResult} onClose={() => setTxResult(undefined)}>
        <CompletedTxView
          goToContent="Home"
          title="Success"
          txLink={makeEtherscanLink(txResult?.hash)}
          onGoToClick={handleCloseSuccessModal}
          message={
            <span className="text-sm text-grey300">{`You've successfully staked ETH.`}</span>
          }
        />
      </ModalDialog>
    </div>
  )
}
