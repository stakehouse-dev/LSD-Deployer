import { Wizard } from '@blockswaplab/lsd-wizard'
import { Dialog, Switch } from '@headlessui/react'
import classNames from 'classnames'
import { useState } from 'react'
import { useSigner } from 'wagmi'

import { ReactComponent as CloseCircleIcon } from '@/assets/images/close-circle.svg'
import { ReactComponent as BlueAlertIcon } from '@/assets/images/icon-alert-blue.svg'
import {
  Button,
  ClipboardCopy,
  CompletedTxView,
  LoadingModalView,
  Modal,
  Tooltip
} from '@/components/shared'
import { useCustomAccount, useMakeRealTxHash, useNetworkBasedLinkFactories, useSDK } from '@/hooks'
import { TStakehouseWizard } from '@/types'
import { handleErr, notifyHash, noty } from '@/utils/global'

import styles from './styles.module.scss'

interface ModalEditGateProps {
  open: boolean
  lsdWizard: TStakehouseWizard | undefined
  liquidStakingManagerAddress: string
  onClose: () => void
}

export const ModalEditGate = ({
  open,
  lsdWizard,
  liquidStakingManagerAddress,
  onClose
}: ModalEditGateProps) => {
  const [isLoading, setLoading] = useState(false)
  const [txResult, setTxResult] = useState<any>()
  const [gateKeeper, setGateKeeper] = useState(false)

  const { isGnosis } = useCustomAccount()
  const { data: signer } = useSigner()
  const { hash } = useMakeRealTxHash(txResult?.hash)
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()

  const handleUpdateGateKeeper = async () => {
    if (lsdWizard) {
      setLoading(true)
      try {
        const lsdWizard = new Wizard({
          signerOrProvider: signer,
          liquidStakingManagerAddress: liquidStakingManagerAddress
        })
        const tx = await lsdWizard.utils.updateWhitelisting(gateKeeper)
        if (!isGnosis) notifyHash(tx.hash)
        await tx.wait()
        setLoading(false)
        setTxResult(tx)
      } catch (err) {
        console.log('Failed to update ticker name.')
        setLoading(false)
        noty(handleErr(err, 'Something went wrong'))
      }
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
            <h3 className={styles.editModalLayoutHeader}>Edit Gate Keeper</h3>
            <div className="w-full flex items-center gap-3 my-3">
              <p className="text-sm text-grey600">Deploy Gatekeeping</p>
              <Tooltip message="Decide who can join your LSD Network." />
              <Switch
                checked={gateKeeper}
                onChange={setGateKeeper}
                className={classNames(
                  gateKeeper ? 'bg-primary' : 'bg-black',
                  'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                )}>
                <span
                  aria-hidden="true"
                  className={classNames(
                    gateKeeper ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                  )}
                />
              </Switch>
            </div>
            <Button onClick={handleUpdateGateKeeper} variant="primary">
              Update
            </Button>
          </div>
        )}
      </Dialog.Panel>
    </Modal>
  )
}
