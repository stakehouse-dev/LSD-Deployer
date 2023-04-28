import { Dialog } from '@headlessui/react'
import { FC, useEffect, useState } from 'react'
import tw from 'twin.macro'

import { ReactComponent as CloseCircleIcon } from '@/assets/images/close-circle.svg'
import { ReactComponent as CheckIcon } from '@/assets/images/icon-check-white.svg'
import { ReactComponent as InfoIcon } from '@/assets/images/info-filled.svg'
import {
  Button,
  ClipboardCopy,
  CompletedTxView,
  ErrorModal,
  Modal,
  ModalDialog,
  Spinner,
  TextInput,
  UploadKeyStoreFile,
  ValidatorRegisterCard
} from '@/components/shared'
import { useGetETH, useNetworkBasedLinkFactories, useReadyToStake, useStake } from '@/hooks'
import { KeystoreT } from '@/types'
import { handleErr, humanReadableAddress, notifyHash } from '@/utils/global'

import styles from './styles.module.scss'

interface IProps {
  open: boolean
  blsPublicKey: string
  onStaked: () => void
  onClose: () => void
}

interface PasswordValidationT {
  required?: string | undefined
  length?: string | undefined
}

const ModalValidatorStake: FC<IProps> = ({ open, blsPublicKey, onStaked, onClose }) => {
  // states
  const [step, setStep] = useState<number>(1)
  const [firstStep, setFirstStep] = useState<number>(1)
  const [keystoreObject, setKeystoreObject] = useState<KeystoreT>()
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordValidationErr, setPasswordValidationErr] = useState<PasswordValidationT>()
  const [txResult, setTxResult] = useState<any>()
  const [error, setError] = useState<any>()

  // custom hooks
  const { handleGetFeesMevETH, handleGetSavETH, isLoading: isGettingEth, setLoading } = useGetETH()
  const { handleApproveStake, isLoading: isApproving, setLoading: setApproving } = useStake()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()
  const { funds, isLoading, checkReadyToStake } = useReadyToStake(blsPublicKey)

  useEffect(() => {
    if (open) {
      checkReadyToStake()
    }
  }, [open])

  useEffect(() => {
    if (!confirmPassword) {
      return setPasswordValidationErr({ required: 'Password is required' })
    } else if (confirmPassword.length < 8) {
      return setPasswordValidationErr({ length: 'Your password must be 8 or more characters.' })
    } else {
      setPasswordValidationErr(undefined)
    }
  }, [confirmPassword])

  useEffect(() => {
    if (funds) {
      if (funds.savETH !== 0) {
        setFirstStep(1)
      } else if (funds.savETH === 0 && funds.feesAndMEV !== 0) {
        setFirstStep(2)
      } else if (funds.savETH === 0 && funds.feesAndMEV === 0) {
        setFirstStep(3)
        setStep(2)
      }
    }
  }, [funds])

  const handleGoNextStep = (keystoreObject: KeystoreT) => {
    setKeystoreObject(keystoreObject)
  }

  const handleApprove = async () => {
    try {
      const result = await handleApproveStake(confirmPassword, keystoreObject!)
      notifyHash(result.hash)
      await result.wait()
      setTxResult(result)
    } catch (err) {
      console.log('approve err: ', err)
      setError(handleErr(err, 'Please ensure the password and validator file are correct.'))
      setApproving(false)
    }
  }

  const handleGetETH = async (blsPublicKey: string, funds: number, type: 'sav' | 'fees') => {
    let txResult
    if (type === 'sav') {
      txResult = await handleGetSavETH(blsPublicKey, funds)
    } else {
      txResult = await handleGetFeesMevETH(blsPublicKey, funds)
    }

    if (txResult) {
      notifyHash(txResult.hash)
      await txResult.wait()
      setLoading(false)
      setFirstStep((s) => (s += 1))

      if (firstStep === 2) {
        setStep(2)
      }
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
        onAction={() => {
          setError('')
          setKeystoreObject(undefined)
          setConfirmPassword('')
        }}
      />
    )
  }

  if (txResult) {
    return (
      <ModalDialog open={open} onClose={onStaked}>
        <CompletedTxView
          goToContent="Home"
          title="Success"
          txLink={makeEtherscanLink(txResult?.hash)}
          onGoToClick={onStaked}
          message={
            <div className="flex flex-col items-center">
              <span className="text-sm text-grey300">
                You have successfully staked your validator
              </span>
              <span className="text-sm text-grey300">with the Ethereum deposit contract.</span>
            </div>
          }
        />
      </ModalDialog>
    )
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className={styles.modalLayoutBig}>
        <div className="absolute top-3 right-3 cursor-pointer" onClick={onClose}>
          <CloseCircleIcon />
        </div>

        <div className="flex flex-col items-center text-white gap-4">
          <InfoIcon />
          <span className="text-lg font-bold">Confirmation</span>

          <ClipboardCopy copyText={blsPublicKey}>
            <span className="text-sm font-medium">
              <span className="text-grey700">Address: </span>
              {humanReadableAddress(blsPublicKey, 9)}
            </span>
          </ClipboardCopy>
        </div>
        <div className="flex flex-col w-full mt-4 gap-2">
          <ValidatorRegisterCard
            active={step === 1}
            done={step === 2}
            stepNum={1}
            title="Fund 28 ETH for your validator"
            tooltip="Fund 28 ETH for your Validator">
            <div className="flex flex-col gap-2 w-full">
              <Card>
                {isLoading ? (
                  <>
                    <span>You need more ETH in savETH pool.</span>
                    <Spinner size={24} />
                  </>
                ) : firstStep === 1 ? (
                  <>
                    <span>You need {funds?.savETH ?? 0} more ETH in savETH pool.</span>
                    <Button
                      disabled={isGettingEth}
                      onClick={() => handleGetETH(blsPublicKey, funds?.savETH ?? 0, 'sav')}>
                      Get ETH
                    </Button>
                  </>
                ) : (
                  <>
                    <span>Fund 28 ETH for your validator</span>
                    <div className="flex items-center justify-center text-sm gap-1">
                      Done <CheckIcon />
                    </div>
                  </>
                )}
              </Card>
              <Card>
                {isLoading ? (
                  <>
                    <span>You need more ETH in Fees & MEV pool.</span>
                    <Spinner size={24} />
                  </>
                ) : firstStep <= 2 ? (
                  <>
                    <span className={`${(funds?.savETH ?? 0) > 0 && 'text-grey500'}`}>
                      You need {funds?.feesAndMEV ?? 0} more ETH in Fees & MEV pool.
                    </span>
                    <Button
                      disabled={firstStep === 1 || isGettingEth}
                      onClick={() => handleGetETH(blsPublicKey, funds?.feesAndMEV ?? 0, 'fees')}>
                      Get ETH
                    </Button>
                  </>
                ) : (
                  <>
                    <span>Fund 28 ETH for your validator</span>
                    <div className="flex items-center justify-center text-sm gap-1">
                      Done <CheckIcon />
                    </div>
                  </>
                )}
              </Card>
            </div>
          </ValidatorRegisterCard>
          <ValidatorRegisterCard
            active={step === 2}
            done={step === 3}
            stepNum={2}
            title="Confirm your Keystore file"
            tooltip="Make sure you are uploading the correct validator signing key.">
            <UploadKeyStoreFile
              onUploaded={handleGoNextStep}
              onClear={() => setKeystoreObject(undefined)}
            />
            <div className="flex flex-col w-full gap-2">
              <TextInput
                label="Confirm Keystore Password"
                type="password"
                disabled={!keystoreObject}
                className={styles.input}
                tooltip=" "
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {passwordValidationErr?.required && (
                <span className={styles.inputErr}>{passwordValidationErr.required}</span>
              )}
              {passwordValidationErr?.length && (
                <span className={styles.inputErr}>{passwordValidationErr.length}</span>
              )}
              <span className="text-primary text-sm text-left">
                Ensure the password is correct or else the transaction will fail.
              </span>
            </div>
          </ValidatorRegisterCard>
          {isApproving ? (
            <div className="w-full flex justify-center items-center mt-4">
              <Spinner size={30} />
            </div>
          ) : (
            <Button
              size="lg"
              disabled={!keystoreObject || !confirmPassword}
              onClick={handleApprove}>
              Approve Transaction
            </Button>
          )}
        </div>
      </Dialog.Panel>
    </Modal>
  )
}

const Card = tw.div`border border-innerBorder rounded-lg flex items-center justify-between text-sm text-white py-4 px-2 pr-3`

export default ModalValidatorStake
