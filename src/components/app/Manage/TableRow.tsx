import { useQuery } from '@apollo/client'
import { Wizard } from '@blockswaplab/lsd-wizard'
import { useEffect, useMemo, useState } from 'react'
import tw from 'twin.macro'
import { useSigner } from 'wagmi'

import { ReactComponent as ThreeDotIcon } from '@/assets/images/icon-dot-three.svg'
import { ReactComponent as GateIcon } from '@/assets/images/icon-gate.svg'
import { ReactComponent as PercentIcon } from '@/assets/images/icon-percent.svg'
import { ReactComponent as ShareIcon } from '@/assets/images/icon-share.svg'
import { ReactComponent as PenIcon } from '@/assets/images/pen.svg'
import { ClipboardCopy, Dropdown, ErrorModal } from '@/components/shared'
import { TMenu, TStakehouseWizard } from '@/types'
import { humanReadableAddress } from '@/utils/global'

import { ModalEditCommission, ModalEditGate, ModalEditTicker } from '../Modals'

interface TableRowProps {
  network: any
  order: number
  disabled: boolean
  onRefresh: () => void
}

export const TableRow = ({ network, order, disabled, onRefresh }: TableRowProps) => {
  const [openEditTickerModal, setOpenEditTickerModal] = useState(false)
  const [openEditCommissionModal, setOpenEditCommissionModal] = useState(false)
  const [openEditGateModal, setOpenEditGateModal] = useState(false)
  const [openErrorModal, setOpenErrorModal] = useState(false)
  const [disabledTickerModal, setDisabledTickerModal] = useState(false)
  const [lsdWizard, setLsdWizard] = useState<TStakehouseWizard>()

  const { data: signer } = useSigner()

  useEffect(() => {
    if (network && signer) {
      const lsdWizard = new Wizard({
        signerOrProvider: signer,
        liquidStakingManagerAddress: network.id
      })
      setLsdWizard(lsdWizard)
    }
  }, [network, signer])

  const handleOpenEditTickerModal = () => {
    if (network.numberOfKnotsThatHaveMintedDerivatives < 1) {
      setOpenEditTickerModal(true)
    } else setDisabledTickerModal(true)
  }
  const handleCloseEditTickerModal = () => {
    setOpenEditTickerModal(false)
  }
  const handleOpenEditCommissionModal = () => {
    if (!disabled) setOpenEditCommissionModal(true)
    else setOpenErrorModal(true)
  }
  const handleCloseEditCommissionModal = () => {
    setOpenEditCommissionModal(false)
    onRefresh()
  }
  const handleOpenEditGateModal = () => {
    if (!disabled) setOpenEditGateModal(true)
    else setOpenErrorModal(true)
  }
  const handleCloseEditGateModal = () => {
    setOpenEditGateModal(false)
    onRefresh()
  }

  const options: TMenu[] = [
    {
      id: 0,
      label: 'Edit Ticker',
      icon: <PenIcon />,
      helper: 'Ticker can be five characters maximum.',
      onClick: handleOpenEditTickerModal
    },
    {
      id: 1,
      label: 'Edit Commission',
      icon: <PercentIcon />,
      helper: 'Commissions are taken from Node Operators and Fees and MEV stakers.',
      onClick: handleOpenEditCommissionModal
    },
    {
      id: 2,
      label: 'Edit GateKeeping',
      icon: <GateIcon />,
      helper: 'Decide who can join your LSD Network. Learn more.',
      onClick: handleOpenEditGateModal
    }
  ]

  if (!network) {
    return <></>
  }

  return (
    <tr
      className="border-t border-innerBorder text-sm font-medium relative"
      style={{ zIndex: 99 - order }}>
      <TableCell>{order + 1}</TableCell>
      <TableCell>
        <ClipboardCopy copyText={network.dao || ''}>
          {network.dao ? humanReadableAddress(network.dao, 9) : ''}
        </ClipboardCopy>
      </TableCell>
      <TableCell className="text-center">{network.ticker}</TableCell>
      <TableCell className="text-center">
        {network.commission ? Number(network.commission) / 100000 : 0}%
      </TableCell>
      <TableCell className="text-center">{network.numberOfValidatorsBeingPrepared}</TableCell>
      <TableCell className="text-center">
        <Dropdown options={options}>
          <div className="topbar__menu-btn">
            <ThreeDotIcon />
          </div>
        </Dropdown>
      </TableCell>
      <ModalEditTicker
        open={openEditTickerModal}
        lsdWizard={lsdWizard}
        defaultValue={network.ticker}
        onClose={handleCloseEditTickerModal}
      />
      <ModalEditCommission
        open={openEditCommissionModal}
        lsdWizard={lsdWizard}
        liquidStakingManagerAddress={network.id}
        defaultValue={network.commission ? Number(network.commission) / 100000 : 0}
        onClose={handleCloseEditCommissionModal}
      />
      <ModalEditGate
        open={openEditGateModal}
        lsdWizard={lsdWizard}
        liquidStakingManagerAddress={network.id}
        onClose={handleCloseEditGateModal}
      />
      <ErrorModal
        open={openErrorModal}
        onClose={() => setOpenErrorModal(false)}
        title="Error"
        message="Only the DAO address set during LSD deployment can update parameters."
      />
      <ErrorModal
        open={disabledTickerModal}
        onClose={() => setDisabledTickerModal(false)}
        title="Error"
        message="You cannot edit ticker for LSD after the validator has minted derivatives."
      />
    </tr>
  )
}

const Label = tw.div`flex items-center gap-2`
const TableCell = tw.td`px-3 content-center h-16`
