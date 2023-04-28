import { Dialog } from '@headlessui/react'
import { FC, useEffect, useState } from 'react'
import tw from 'twin.macro'

import { ReactComponent as CloseCircleIcon } from '@/assets/images/close-circle.svg'
import { ReactComponent as CheckGreenIcon } from '@/assets/images/icon-check-green.svg'
import { ReactComponent as CheckIcon } from '@/assets/images/icon-check-white.svg'
import { ReactComponent as DollarGreenIcon } from '@/assets/images/icon-dollar-green.svg'
import { ReactComponent as InfoIcon } from '@/assets/images/info-filled.svg'
import {
  Button,
  ClipboardCopy,
  CompletedTxView,
  ErrorModal,
  Modal,
  ModalDialog,
  Spinner,
  Tooltip
} from '@/components/shared'
import { useMint, useNetworkBasedLinkFactories, useReportBalance } from '@/hooks'
import { handleErr, noty } from '@/utils/global'

import styles from './styles.module.scss'

interface IProps {
  open: boolean
  blsPublicKey: string
  onMinted: () => void
  onClose: () => void
}

const ModalValidatorMint: FC<IProps> = ({ open, blsPublicKey, onMinted, onClose }) => {
  const [isMintStep, setMintStep] = useState<boolean>(false)
  const [confirmedKey, setConfirmedKey] = useState(false)
  const [txResult, setTxResult] = useState<any>()
  const [error, setError] = useState<any>()

  const { handleSubmit, handleReset, isSubmitted, isSubmitting, signature } = useReportBalance()
  const { handleMint, isSubmitting: isMinting } = useMint()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()

  const handleClose = (minted?: boolean) => {
    setMintStep(false)
    setConfirmedKey(false)
    setTxResult(undefined)
    handleReset()
    setError(undefined)
    minted ? onMinted() : onClose()
  }

  useEffect(() => {
    setMintStep(false)
    setConfirmedKey(false)
  }, [open])

  const handleShowMintModal = () => {
    setMintStep(true)
  }

  const onMint = async () => {
    try {
      const txResult = await handleMint(blsPublicKey, signature!)
      setTxResult(txResult)
    } catch (err) {
      console.log('mint error')
      console.log(err)
      setError(handleErr(err))
      noty(handleErr(err))
    }
  }

  if (error) {
    return (
      <ErrorModal
        open={open}
        onClose={onClose}
        title="Transaction Error"
        message={error}
        actionButtonContent="Try Again"
        onAction={handleClose}
      />
    )
  }

  if (txResult) {
    return (
      <ModalDialog open={open} onClose={() => handleClose(true)}>
        <CompletedTxView
          goToContent="Home"
          title="Success"
          txLink={makeEtherscanLink(txResult?.hash)}
          onGoToClick={() => handleClose(true)}
          message={
            <div className="flex flex-col items-center">
              <span className="text-sm text-grey300">
                You have successfully minted derivatives for the validator.
              </span>
            </div>
          }
        />
      </ModalDialog>
    )
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Dialog.Panel className={styles.modalLayoutBig}>
        <div className="absolute top-3 right-3 cursor-pointer" onClick={() => handleClose()}>
          <CloseCircleIcon />
        </div>
        {!isMintStep ? (
          <>
            <div className="flex flex-col items-center text-white gap-4">
              <InfoIcon />
              <span className="text-lg font-bold">Minting Available</span>
            </div>
            <div className="flex flex-col w-full mt-4 gap-2">
              <Card>
                <Label>
                  Report Balance{' '}
                  <Tooltip message="This will confirm your validator effective balance from the consensus layer to the smart contract." />
                </Label>
                {!isSubmitted ? (
                  isSubmitting ? (
                    <div className="w-1/3 flex items-center justify-center">
                      <Spinner size={32} />
                    </div>
                  ) : (
                    <Button className="w-1/3" onClick={() => handleSubmit(blsPublicKey)}>
                      Submit
                    </Button>
                  )
                ) : (
                  <div className="w-1/3 flex items-center justify-center text-sm gap-1">
                    Done <CheckIcon />
                  </div>
                )}
              </Card>
              <Card>
                <Label>
                  Mint Tokens{' '}
                  <Tooltip message="You will mint derivatives dETH and SLOT for your validator." />
                </Label>
                <Button
                  className="w-1/3"
                  disabled={!isSubmitted}
                  borderless={true}
                  onClick={handleShowMintModal}>
                  Mint
                </Button>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-white gap-4">
              <DollarGreenIcon />
              <span className="text-lg font-bold">Mint your tokens</span>
            </div>
            <div className="flex flex-col text-white w-full gap-6">
              <div className="break-all text-left">
                {blsPublicKey}
                <ClipboardCopy inline={true} copyText="" />
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-white font-medium flex items-center gap-4">
                  Confirm Validator Key
                  <Tooltip message="Confirm this is the validator key located in your deposit_data.json and keystore.json files." />
                </div>
                {confirmedKey ? (
                  <div className="w-1/3 flex justify-center items-center gap-2 font-semibold text-primary700 h-11">
                    Done <CheckGreenIcon />
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-1/3"
                    onClick={() => setConfirmedKey(true)}>
                    Confirm
                  </Button>
                )}
              </div>
              {isMinting ? (
                <div className="w-full flex items-center justify-center">
                  <Spinner size={32} />
                </div>
              ) : (
                <Button size="lg" disabled={!confirmedKey} onClick={onMint}>
                  Mint Tokens
                </Button>
              )}
            </div>
          </>
        )}
      </Dialog.Panel>
    </Modal>
  )
}

const Card = tw.div`border border-innerBorder rounded-lg flex justify-between text-white py-4 px-8`
const Label = tw.span`flex items-center gap-1`

export default ModalValidatorMint
