import './NodeOperator.scss'

import { FC, useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'

import ArrowLeftSVG from '@/assets/images/arrow-left.svg'
import {
  Button,
  ComboMenu,
  CompletedTxView,
  ErrorModal,
  LoadingModal,
  ModalDialog,
  Tooltip,
  UploadDepositFile,
  ValidatorRegisterCard
} from '@/components/shared'
import { MAX_GAS_FEE } from '@/constants'
import { config } from '@/constants/environment'
import { useDepositNodeRunner, useLSDNetworkList, useNetworkBasedLinkFactories } from '@/hooks'
import { DepositObjectT, TMenu } from '@/types'
import { handleErr } from '@/utils/global'

import { DepositFooter } from './Footer'

type NodeOperatorProps = {
  onBack: () => void
}
export const NodeOperator: FC<NodeOperatorProps> = ({ onBack }) => {
  // states
  const [selectedNetwork, setSelectedNetwork] = useState<TMenu>()
  const [step, setStep] = useState(1)
  const [failed, setFailed] = useState('')
  const [depositObject, setDepositObject] = useState<DepositObjectT | undefined>()
  const [txResult, setTxResult] = useState<any>()

  // wagmi hooks
  const { data: account } = useAccount()
  const { data: { formatted: balance } = {} } = useBalance({
    addressOrName: account?.address,
    formatUnits: 'ether',
    chainId: config.networkId
  })

  // custom hooks
  const { list } = useLSDNetworkList()
  const { handleDeposit, isLoading, setLoading } = useDepositNodeRunner()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()

  const networkList = useMemo<TMenu[]>(() => {
    if (list) {
      return list.map((network) => ({
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

  const handleGoNextStep = (_depositObject: DepositObjectT) => {
    setDepositObject(_depositObject)
    setStep(2)
  }

  const handleDepositEth = async () => {
    if (
      !selectedNetwork ||
      !depositObject ||
      !account?.address ||
      Number(balance) < 4 + MAX_GAS_FEE
    ) {
      setFailed(
        'Please ensure your deposit_data.json file is correct, and that you have 4 ETH in your wallet.'
      )
      setStep(1)
      setDepositObject(undefined)
      return
    }

    const deposit = depositObject[0]
    if (!deposit) {
      setFailed('Please upload correct Deposit file')
      setStep(1)
      setDepositObject(undefined)
      return
    }

    if (deposit.withdrawal_credentials !== config.WITHDRAWAL_CREDENTIALS) {
      setFailed('Incorrect withdrawal credentials')
      setStep(1)
      setDepositObject(undefined)
      return
    }

    try {
      const txResult = await handleDeposit(
        `${selectedNetwork.id}`,
        deposit.pubkey,
        deposit.signature,
        account?.address
      )
      setTimeout(() => {
        setTxResult(txResult)
      }, 500)
    } catch (err: any) {
      console.log('deposit by node runner error-----------------')
      console.log(err, err.message)
      setLoading(false)
      setTimeout(() => {
        setFailed(
          handleErr(
            err,
            'Please ensure your deposit_data.json file is correct, and that you have 4 ETH in your wallet.'
          )
        )
      }, 500)
    }
  }

  const handleCloseSuccessModal = () => {
    setTxResult(undefined)
    setStep(1)
    setDepositObject(undefined)
    onBack()
  }

  return (
    <div className="content node-operator">
      <div className="content__box">
        <div className="content__box__title">
          <img src={ArrowLeftSVG} className="icon-left-arrow" onClick={onBack} />
          Node Operator
        </div>
        <ValidatorRegisterCard
          active={step === 1}
          done={step === 2}
          stepNum={1}
          title="Register your Validator"
          tooltip="This will register your validator BLS key with an LSD Network to receive 28 ETH funding.">
          <UploadDepositFile
            onUploaded={handleGoNextStep}
            onClear={() => setDepositObject(undefined)}
          />
        </ValidatorRegisterCard>
        <ValidatorRegisterCard
          active={step === 2}
          done={step === 3}
          stepNum={2}
          title="Deposit 4 ETH"
          tooltip="This will prepare your validator keys to to have 28 ETH matched from the community.">
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
            <Button disabled={isLoading} onClick={handleDepositEth}>
              Deposit
            </Button>
          </div>
        </ValidatorRegisterCard>
      </div>
      <DepositFooter from="Node Runner" />
      <ErrorModal
        open={!!failed}
        onClose={() => setFailed('')}
        title="Deposit Failed"
        message={
          failed === 'Incorrect withdrawal credentials' ? (
            <>
              Incorrect withdrawal credentials.
              <br />
              Make sure to use Goerli Stakehouse Account Manager as the withdrawal credential.{' '}
              <a
                target={'_blank'}
                className="text-primary300"
                href="https://help.joinstakehouse.com/en/articles/6597473-staking-using-wagyu-keygen-for-testnet"
                rel="noreferrer">
                Learn More.
              </a>
            </>
          ) : (
            failed
          )
        }
        actionButtonContent="Try Again"
        onAction={() => setFailed('')}
      />
      <LoadingModal open={isLoading} onClose={() => {}} title="Confirmation Pending" />
      <ModalDialog open={!!txResult} onClose={handleCloseSuccessModal}>
        <CompletedTxView
          goToContent="Home"
          title="Success"
          txLink={makeEtherscanLink(txResult?.hash)}
          onGoToClick={handleCloseSuccessModal}
          message={
            <div className="flex flex-col items-center">
              <span className="text-sm text-grey300">
                You have successfully registered your validator and a 4 ETH bond to an LSD Network.
              </span>
            </div>
          }
        />
      </ModalDialog>
    </div>
  )
}
