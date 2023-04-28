import { FC, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tw, { styled } from 'twin.macro'
import { useAccount } from 'wagmi'

import { ReactComponent as ArrowRightIcon } from '@/assets/images/icon-arrow-right.svg'
import { ReactComponent as ArrowUpIcon } from '@/assets/images/icon-arrow-up.svg'
import { ReactComponent as EmptyCheckBoxIcon } from '@/assets/images/icon-check-empty.svg'
import { ReactComponent as FullCheckBoxIcon } from '@/assets/images/icon-check-full.svg'
import { ReactComponent as EthIcon } from '@/assets/images/icon-eth.svg'
import {
  Button,
  ComboMenu,
  CompletedTxView,
  ErrorModal,
  LoadingModal,
  ModalDialog,
  Spinner,
  Tooltip
} from '@/components/shared'
import { MIN_AMOUNT, WITHDRAW_MODE } from '@/constants'
import {
  useLSDNetworkList,
  useLsdValidators,
  useLsdValidatorsByNetwork,
  useNetworkBasedLinkFactories,
  useWithdrawBalance,
  useWithdrawMethod
} from '@/hooks'
import { TLSDNetwork, TMenu } from '@/types'

type WithdrawModeProps = {
  mode: WITHDRAW_MODE
  isActive: boolean
  label: string
  handleOpen: (mode: WITHDRAW_MODE) => void
}

export const WithdrawMode: FC<WithdrawModeProps> = ({ label, mode, isActive, handleOpen }) => {
  const [isChecked, setIsChecked] = useState<boolean>(false)
  const [amount, setAmount] = useState<string>('')
  const [txResult, setTxResult] = useState<any>()
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState<string>()
  const [selectedNetwork, setSelectedNetwork] = useState<TMenu>({} as TMenu)
  const [selectedValidator, setSelectedValidator] = useState<TMenu>({} as TMenu)

  const navigate = useNavigate()
  const { data: account } = useAccount()
  const { balance, refetch: refetchBalance } = useWithdrawBalance(mode)
  const { handleWithdraw, isLoading, setLoading } = useWithdrawMethod()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()
  const { list } = useLSDNetworkList()
  const { lsdNetworkBalance, refetch: refetchNodeOperatorBalance } = useLsdValidators(
    account?.address ?? ''
  )
  const { validators, loading } = useLsdValidatorsByNetwork(
    account?.address ?? '',
    selectedNetwork.id as string
  )

  const networkList = useMemo<TMenu[]>(() => {
    if (list) {
      return list.map((network: TLSDNetwork) => ({
        id: network.liquidStakingManager,
        label: network.ticker
      })) as TMenu[]
    }

    return []
  }, [list])

  const validatorList = useMemo<TMenu[]>(() => {
    if (validators) {
      return validators.map((validator: string) => ({
        id: validator,
        label: `${validator.slice(0, 8)}...${validator.slice(-4)}`
      })) as TMenu[]
    }

    return []
  }, [validators])

  useEffect(() => {
    if (networkList && networkList.length > 0) {
      setSelectedNetwork(networkList[0])
    }
  }, [networkList])

  useEffect(() => {
    if (validatorList && validatorList.length > 0) {
      setSelectedValidator(validatorList[0])
    }
  }, [validatorList])

  const handleCloseSuccessModal = () => {
    setTxResult(undefined)
    setAmount('')
    navigate('/')
  }

  const onOpenClick = () => {
    handleOpen(mode)
    setIsChecked(false)
    setAmount('')
  }
  const onMaxClick = () => {
    setAmount(
      mode === WITHDRAW_MODE.NODE_OPERATOR ? lsdNetworkBalance[selectedNetwork.id] : balance
    )
  }

  const handleWithdrawEth = async () => {
    try {
      let txResult: any
      if (mode === WITHDRAW_MODE.NODE_OPERATOR)
        txResult = await handleWithdraw(
          mode,
          Number(amount),
          selectedNetwork.id,
          selectedValidator.id
        )
      else txResult = await handleWithdraw(mode, Number(amount))

      setTimeout(() => {
        setTxResult(txResult)
      }, 500)
      refetchBalance()
      refetchNodeOperatorBalance()
    } catch (err: any) {
      console.log(`withdraw ${label} error-----------------`)
      console.log(err, err.message)
      setLoading(false)
      setTimeout(() => {
        setError(err.reason[0].toUpperCase() + err.reason.substr(1))
        setFailed(true)
      }, 500)
    }
  }

  const errMessage = useMemo(() => {
    const _balance =
      mode === WITHDRAW_MODE.NODE_OPERATOR ? lsdNetworkBalance[selectedNetwork.id] : balance

    if (!_balance || amount === '') return ''

    if (Number(_balance) < MIN_AMOUNT || Number(amount) > Number(_balance)) {
      return 'Insufficient Balance'
    }

    if (Number(amount) < Number(MIN_AMOUNT)) {
      return 'Amount should be greater than 0.001'
    }

    return ''
  }, [balance, amount])

  return (
    <Mode isActive={isActive}>
      <div
        onClick={onOpenClick}
        className="flex items-center justify-between cursor-pointer px-4 py-3">
        <Label>
          <EthIcon />
          {label}
        </Label>
        <div className="text-sm font-medium text-grey700 flex items-center gap-2">
          Available <Balance isActive={Number(balance) > 0}>{balance} ETH</Balance>
          {isActive ? <ArrowUpIcon /> : <ArrowRightIcon />}
        </div>
      </div>
      {isActive && (
        <>
          {isChecked && (
            <div className="flex flex-col px-3 py-2 gap-2">
              {mode !== WITHDRAW_MODE.NODE_OPERATOR && (
                <div className="withdraw__input">
                  <input
                    value={amount}
                    placeholder="Amount"
                    onChange={(e) => {
                      if (!isNaN(Number(e.target.value))) {
                        setAmount(e.target.value)
                      }
                    }}
                  />
                  <div className="withdraw__input__max">
                    <span>ETH</span>
                    <button onClick={onMaxClick}>
                      <p className="text-xs font-medium text-primary700">MAX</p>
                    </button>
                  </div>
                </div>
              )}
              {mode === WITHDRAW_MODE.NODE_OPERATOR ? (
                <div className="flex justify-between">
                  <span className="ml-2 text-xs text-error">{errMessage}</span>
                  <div className="text-sm font-medium text-grey700 text-right">
                    LSD Network Balance:{' '}
                    <Balance isActive={Number(lsdNetworkBalance[selectedNetwork.id]) > 0}>
                      {Number(lsdNetworkBalance[selectedNetwork.id]).toLocaleString(undefined, {
                        maximumFractionDigits: 4
                      })}{' '}
                      ETH
                    </Balance>
                  </div>
                </div>
              ) : (
                <span className="ml-2 text-xs text-error">{errMessage}</span>
              )}
              {mode === WITHDRAW_MODE.NODE_OPERATOR && (
                <div className="border border-innerBorder rounded-lg w-full p-3 flex flex-col gap-2">
                  <div className="flex w-full items-center justify-between">
                    <p className="text-sm text-white font-medium flex items-center gap-1">
                      Select LSD Network
                      <Tooltip message="Select an LSD Network to associate your validator with." />
                    </p>
                    <ComboMenu
                      onSelect={setSelectedNetwork}
                      selected={selectedNetwork}
                      options={networkList}
                      className="w-40 h-10"
                    />
                  </div>
                  {loading && (
                    <div className="flex mt-2 items-center justify-center">
                      <Spinner size={24} />
                    </div>
                  )}
                  {!loading && (
                    <>
                      {validatorList.length > 0 ? (
                        <div className="flex w-full items-center justify-between">
                          <p className="text-sm text-white font-medium">Select Validator</p>
                          <ComboMenu
                            onSelect={setSelectedValidator}
                            selected={selectedValidator}
                            options={validatorList}
                            className="w-40 h-10"
                          />
                        </div>
                      ) : (
                        <div className="text-grey700 text-center mt-2 text-sm">
                          No validator available in this network
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <Button
                size="lg"
                disabled={
                  mode === WITHDRAW_MODE.NODE_OPERATOR
                    ? !selectedValidator || !validatorList.length
                    : !Number(amount) || errMessage.length > 0
                }
                onClick={handleWithdrawEth}>
                Withdraw
              </Button>
            </div>
          )}
          <div className="flex gap-1 px-4 cursor-pointer" onClick={() => setIsChecked(true)}>
            {isChecked ? <FullCheckBoxIcon /> : <EmptyCheckBoxIcon />}I understand that withdrawing
            ETH will result in losing future rewards for staked ETH.
          </div>
        </>
      )}

      <LoadingModal open={isLoading} title="Confirmation Pending" onClose={() => {}} />
      <ErrorModal
        open={failed}
        onClose={() => setFailed(false)}
        title="Withdraw Failed"
        message={error}
        actionButtonContent="Try Again"
        onAction={() => setFailed(false)}
      />
      <ModalDialog open={!!txResult} onClose={() => setTxResult(undefined)}>
        <CompletedTxView
          goToContent="Home"
          title="Success"
          txLink={makeEtherscanLink(txResult?.hash)}
          onGoToClick={handleCloseSuccessModal}
          message={
            <div className="flex flex-col items-center">
              <span className="text-sm text-grey300">{`Your transaction has processed.`}</span>
            </div>
          }
        />
      </ModalDialog>
    </Mode>
  )
}

const Label = tw.span`flex items-center gap-1 text-base font-semibold`

const Mode = styled.div<{ isActive: boolean }>`
  ${tw`border rounded-lg border-innerBorder flex flex-col`}
  ${(props) => props.isActive && tw`bg-[#202024] pb-3`}
`
const Balance = styled.span<{ isActive: boolean }>`
  ${(props) => props.isActive && tw`text-white`}
`
