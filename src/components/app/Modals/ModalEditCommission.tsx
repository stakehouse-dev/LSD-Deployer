import { Wizard } from '@blockswaplab/lsd-wizard'
import { Dialog } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useSigner } from 'wagmi'

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

interface ModalEditCommissionProps {
  open: boolean
  lsdWizard: TStakehouseWizard | undefined
  defaultValue?: number
  liquidStakingManagerAddress: string
  onClose: () => void
}

export const ModalEditCommission = ({
  open,
  lsdWizard,
  defaultValue,
  liquidStakingManagerAddress,
  onClose
}: ModalEditCommissionProps) => {
  const [isLoading, setLoading] = useState(false)
  const [txResult, setTxResult] = useState<any>()

  const { isGnosis } = useCustomAccount()
  const { data: signer } = useSigner()
  const { hash } = useMakeRealTxHash(txResult?.hash)
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()
  const {
    handleSubmit,
    register,
    reset,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      commission: ''
    }
  })

  useEffect(() => {
    if (open) reset({ commission: `${defaultValue}` })
  }, [open, defaultValue])

  const handleUpdateCommission = async (data: { commission: string }) => {
    if (lsdWizard) {
      setLoading(true)
      try {
        const lsdWizard = new Wizard({
          signerOrProvider: signer,
          liquidStakingManagerAddress: liquidStakingManagerAddress
        })
        const tx = await lsdWizard.utils.updateDaoRevenueCommission(
          `${Math.floor(parseFloat(data.commission) * 100000)}`
        )
        if (!isGnosis) notifyHash(tx.hash)
        await tx.wait()
        setLoading(false)
        setTxResult(tx)
      } catch (err) {
        console.log('Failed to update edit commission.')
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
            <h3 className={styles.editModalLayoutHeader}>Edit Commission</h3>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Commission"
                  tooltip="Commissions are taken from Node Operators and Fees and MEV stakers."
                  type="number"
                  className={styles.input}
                  value={value}
                  onChange={(e) =>
                    onChange(Math.floor(parseFloat(e.target.value) * 100000) / 100000)
                  }
                />
              )}
              name="commission"
              rules={{ max: 100, min: 1 }}
            />
            {errors.commission?.type === 'required' && (
              <p className="text-sm text-error">Commission required</p>
            )}
            {errors.commission?.type === 'max' && (
              <p className="text-sm text-error">Commission should be a number from 1 to 100.</p>
            )}
            {errors.commission?.type === 'min' && (
              <p className="text-sm text-error">Commission should be a number from 1 to 100.</p>
            )}
            <Button onClick={handleSubmit(handleUpdateCommission)} variant="primary">
              Update
            </Button>
          </div>
        )}
      </Dialog.Panel>
    </Modal>
  )
}
