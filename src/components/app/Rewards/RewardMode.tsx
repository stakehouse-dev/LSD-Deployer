import { useQuery } from '@apollo/client'
import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tw, { styled } from 'twin.macro'
import { useAccount } from 'wagmi'

import { ReactComponent as ArrowRightIcon } from '@/assets/images/icon-arrow-right.svg'
import { ReactComponent as ArrowUpIcon } from '@/assets/images/icon-arrow-up.svg'
import {
  Button,
  ComboMenu,
  CompletedTxView,
  ErrorModal,
  LoadingModal,
  ModalDialog,
  Tooltip
} from '@/components/shared'
import { WITHDRAW_MODE } from '@/constants'
import { RewardsContext } from '@/context/RewardsContext'
import { MintedValidators } from '@/graphql/queries/NodeRunners'
import { useClaimMethod, useLSDNetworkList, useNetworkBasedLinkFactories } from '@/hooks'
import { TLSDNetwork, TMenu } from '@/types'
import { roundNumber } from '@/utils/global'

type RewardModeProps = {
  mode: WITHDRAW_MODE
  isActive: boolean
  label: string
  handleOpen: (mode: WITHDRAW_MODE) => void
  src: string
}

const RewardMode: FC<RewardModeProps> = ({ label, mode, isActive, handleOpen, src }) => {
  const [amount, setAmount] = useState<string>('0')
  const [txResult, setTxResult] = useState<any>()
  const [failed, setFailed] = useState(false)
  const [error, setError] = useState<string>()
  const [selectedNetwork, setSelectedNetwork] = useState<TMenu>({} as TMenu)

  const navigate = useNavigate()
  const { data: account } = useAccount()
  const { list } = useLSDNetworkList()
  const { handleClaim, isLoading, setLoading } = useClaimMethod()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()
  const {
    rewards,
    balance: TotalBalance,
    isEligible,
    refetch: refetchBalance
  } = useContext(RewardsContext)

  const { data: validatorsData, loading: validatorsLoading } = useQuery(MintedValidators, {
    variables: {
      account: account?.address?.toLowerCase(),
      network: selectedNetwork.id
    },
    skip: mode !== WITHDRAW_MODE.NODE_OPERATOR
  })

  const balance = useMemo(() => {
    if (rewards && mode && selectedNetwork.id) {
      if (mode === WITHDRAW_MODE.STAKING) {
        return rewards.staking
      } else if (mode === WITHDRAW_MODE.FEES_MEV) {
        return rewards.feesMev
      } else {
        return rewards.nodeOperator[selectedNetwork.id] ?? 0
      }
    }

    return 0
  }, [rewards, mode, selectedNetwork.id])

  const totalNodeOperatorAmount = useMemo(() => {
    if (rewards && TotalBalance) {
      return TotalBalance - rewards.staking - rewards.feesMev
    }

    return 0
  }, [rewards, TotalBalance])

  const networkList = useMemo<TMenu[]>(() => {
    if (list) {
      return list.map((network: TLSDNetwork) => ({
        id: network.liquidStakingManager,
        label: network.ticker
      })) as TMenu[]
    }

    return []
  }, [list])

  useEffect(() => {
    if (networkList && networkList.length > 0) {
      setSelectedNetwork(networkList[0])
    }
  }, [networkList])

  const onOpenClick = () => {
    handleOpen(mode)
    setAmount('')
  }

  const handleCloseSuccessModal = () => {
    setTxResult(undefined)
    setAmount('')
    navigate('/')
  }

  const onMaxClick = () => {
    setAmount(balance)
  }

  const errMessage = useMemo(() => {
    if (!balance || amount === '') return ''

    if (Number(amount) > Number(balance)) {
      return 'Insufficient Balance'
    }

    return ''
  }, [balance, amount])

  const handleClaimEth = async () => {
    try {
      let txResult: any
      if (mode !== WITHDRAW_MODE.NODE_OPERATOR) txResult = await handleClaim(mode, Number(amount))
      else {
        const blsPublicKeys = validatorsData.nodeRunners[0].validators.map((item: any) => item.id)
        txResult = await handleClaim(mode, Number(amount), selectedNetwork.id, blsPublicKeys)
      }

      setTimeout(() => {
        setTxResult(txResult)
      }, 500)

      refetchBalance()
    } catch (err: any) {
      console.log(`withdraw ${label} error-----------------`)
      console.log(err, err.message)
      setLoading(false)
      setTimeout(() => {
        setFailed(true)
        setError(err.reason[0].toUpperCase() + err.reason.substr(1))
      }, 500)
    }
  }

  return (
    <Mode isActive={isActive}>
      <div
        onClick={() => onOpenClick()}
        className="flex items-center justify-between cursor-pointer px-4 py-3">
        <Label>
          <img src={src} className="w-6 h-6" />
          {label}
        </Label>
        <Balance isActive={Number(balance) > 0}>
          <span>
            Available{' '}
            {mode === WITHDRAW_MODE.NODE_OPERATOR
              ? roundNumber(totalNodeOperatorAmount, 3)
              : roundNumber(Number(balance), 3)}{' '}
            {mode !== WITHDRAW_MODE.STAKING ? 'ETH' : 'dETH'}
          </span>
          {isActive ? <ArrowUpIcon /> : <ArrowRightIcon />}
        </Balance>
      </div>
      {isActive && (
        <div className="flex flex-col px-11 py-2 gap-2">
          <div className="withdraw__input">
            <input
              value={mode === WITHDRAW_MODE.NODE_OPERATOR ? balance : amount}
              disabled={mode === WITHDRAW_MODE.NODE_OPERATOR}
              placeholder="Amount"
              onChange={(e) => {
                if (!isNaN(Number(e.target.value))) {
                  setAmount(e.target.value)
                }
              }}
            />
            <div className="withdraw__input__max">
              <span>{mode !== WITHDRAW_MODE.STAKING ? 'ETH' : 'dETH'}</span>
              {mode !== WITHDRAW_MODE.NODE_OPERATOR && (
                <button onClick={onMaxClick}>
                  <p className="text-xs font-medium text-primary700">MAX</p>
                </button>
              )}
            </div>
          </div>
          <span className="ml-2 text-xs text-error">{errMessage}</span>
          {mode === WITHDRAW_MODE.NODE_OPERATOR ? (
            <div className="border border-innerBorder rounded-lg w-full p-4 flex flex-col gap-4">
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
              <Button
                size="lg"
                disabled={
                  !Number(balance) ||
                  validatorsLoading ||
                  !validatorsData.nodeRunners.length ||
                  !isEligible
                }
                onClick={handleClaimEth}>
                Claim
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              disabled={!Number(amount) || errMessage.length > 0}
              onClick={handleClaimEth}>
              Claim
            </Button>
          )}
        </div>
      )}
      <LoadingModal open={isLoading} title="Confirmation Pending" onClose={() => {}} />
      <ErrorModal
        open={failed}
        onClose={() => setFailed(false)}
        title="Claim Failed"
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

export default RewardMode

const Label = tw.span`flex items-center gap-2 text-base font-semibold`
const Mode = styled.div<{ isActive: boolean }>`
  ${tw`border rounded-lg border-innerBorder flex flex-col`}

  ${(props) => props.isActive && tw`bg-[#202024] pb-3`}
`
const Balance = styled.span<{ isActive: boolean }>`
  ${tw`text-sm font-medium text-grey700 flex gap-2 items-center`}
  ${(props) => props.isActive && tw`text-primary`}
`
