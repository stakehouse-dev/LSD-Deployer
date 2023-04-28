import { Dialog } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { ReactComponent as CloseCircleIcon } from '@/assets/images/close-circle.svg'
import { ReactComponent as BlueAlertIcon } from '@/assets/images/icon-alert-blue.svg'
import {
  Button,
  ClipboardCopy,
  CompletedTxView,
  LoadingModalView,
  Modal,
  TextInput
} from '@/components/shared'
import { useCustomAccount, useMakeRealTxHash, useNetworkBasedLinkFactories, useSDK } from '@/hooks'
import { TStakehouseWizard } from '@/types'
import { handleErr, notifyHash, noty } from '@/utils/global'

import styles from './styles.module.scss'

interface ModalEditTickerProps {
  open: boolean
  lsdWizard: TStakehouseWizard | undefined
  defaultValue?: string
  onClose: () => void
}

export const ModalEditTicker = ({
  open,
  lsdWizard,
  defaultValue,
  onClose
}: ModalEditTickerProps) => {
  const [isLoading, setLoading] = useState(false)
  const [txResult, setTxResult] = useState<any>()

  const { isGnosis, networkList } = useCustomAccount()
  const { hash } = useMakeRealTxHash(txResult?.hash)
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()
  const {
    handleSubmit,
    register,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      ticker: ''
    }
  })

  useEffect(() => {
    if (open) reset({ ticker: defaultValue || '' })
  }, [open, defaultValue])

  const handleUpdateTickerName = async (data: { ticker: string }) => {
    if (lsdWizard) {
      setLoading(true)
      try {
        const tx = await lsdWizard.utils.updateStakehouseTicker(data.ticker.toUpperCase())
        if (!isGnosis) notifyHash(tx.hash)
        await tx.wait()
        setLoading(false)
        setTxResult(tx)
      } catch (err) {
        console.log('Failed to update ticker name: ', err)
        setLoading(false)
        noty(handleErr(err, 'Something went wrong'))
      }
      reset()
    }
  }

  const handleClose = () => {
    setTxResult(undefined)
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Dialog.Panel className={styles.modalLayoutBig}>
        <div className="absolute top-3 right-3 cursor-pointer" onClick={handleClose}>
          <CloseCircleIcon />
        </div>
        {txResult ? (
          <CompletedTxView
            goToContent="Home"
            title="Success!"
            txLink={makeEtherscanLink(hash)}
            onGoToClick={handleClose}
            message={
              <span className="text-sm text-grey300">{`You've edited your LSD Network.`}</span>
            }
          />
        ) : isLoading ? (
          <LoadingModalView title="Confirmation Pending" />
        ) : (
          <div className={styles.editModalLayout}>
            <div className="w-full flex justify-center">
              <BlueAlertIcon />
            </div>
            <h3 className={styles.editModalLayoutHeader}>Edit Ticker</h3>
            <TextInput
              label="Ticker"
              tooltip="Ticker can be fix characters maximum."
              type="text"
              className={styles.input}
              {...register('ticker', {
                required: true,
                minLength: 3,
                maxLength: 5,
                pattern: /^[A-Za-z]+$/,
                validate: (value) => !networkList.includes(value.toLowerCase())
              })}
            />
            {errors.ticker?.type === 'required' && (
              <p className="text-sm text-error">Ticker required</p>
            )}
            {errors.ticker?.type === 'pattern' && (
              <p className="text-sm text-error">Ticker should be alphabet only</p>
            )}
            {errors.ticker?.type === 'maxLength' && (
              <p className="text-sm text-error">The length of ticker should be less than 5</p>
            )}
            {errors.ticker?.type === 'minLength' && (
              <p className="text-sm text-error">The length of ticker should be more than 3</p>
            )}
            {errors.ticker?.type === 'validate' && (
              <p className="text-sm text-error">The ticket name already exists</p>
            )}
            <Button onClick={handleSubmit(handleUpdateTickerName)} variant="primary">
              Update
            </Button>
          </div>
        )}
      </Dialog.Panel>
    </Modal>
  )
}
