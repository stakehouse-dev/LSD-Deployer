import { FC, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConnect } from 'wagmi'

import FeesCheckIcon from '@/assets/images/icon-check-fees.svg'
import NodeCheckIcon from '@/assets/images/icon-check-node.svg'
import StakeCheckIcon from '@/assets/images/icon-check-stake.svg'
import FeesIcon from '@/assets/images/icon-fees.svg'
import NodeIcon from '@/assets/images/icon-node.svg'
import StakeIcon from '@/assets/images/icon-stake.svg'
import { ModalWalletConnect } from '@/components/app/Modals'
import { Button } from '@/components/shared'
import { DEPOSIT_MODE } from '@/constants'

import { DepositFooter } from './Footer'

type MainProps = {
  handleModeChange: (mode: DEPOSIT_MODE) => void
}

export const Main: FC<MainProps> = ({ handleModeChange }) => {
  const { isConnected } = useConnect()

  const [openWalletModal, setOpenWalletModal] = useState(false)

  const handleOpenWalletModal = () => {
    setOpenWalletModal(true)
  }
  const handleCloseWalletModal = () => {
    setOpenWalletModal(false)
  }

  return (
    <div className="content">
      <div className="w-full text-center text-4xl font-semibold">How would you like to earn?</div>
      <div className="earning">
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col">
            <img src={StakeIcon} alt="icon" className="mx-auto mb-6" />
            <div className="earning__mode first">
              <div className="earning__mode__title">Protected Staking</div>
              <div className="earning__mode__item">
                <img src={StakeCheckIcon} alt="icon" />
                Earn 33% more staking rewards than traditional validator staking
              </div>
              <div className="earning__mode__item">
                <img src={StakeCheckIcon} alt="icon" />
                No minimum
              </div>
            </div>
            {isConnected && (
              <div className="earning__deposit">
                <Button
                  className="stake-deposit"
                  size="lg"
                  onClick={() => handleModeChange(DEPOSIT_MODE.STAKING)}>
                  Deposit
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <img src={FeesIcon} alt="icon" className="mx-auto mb-6" />
            <div className="earning__mode w-76">
              <div className="earning__mode__title">Fees and MEV</div>
              <div className="earning__mode__item">
                <img src={FeesCheckIcon} alt="icon" />
                Earn 50% of Fees and MEV
              </div>
              <div className="earning__mode__item">
                <img src={FeesCheckIcon} alt="icon" />
                No minimum
              </div>
            </div>
            {isConnected && (
              <div className="earning__deposit">
                <Button
                  className="fees-deposit"
                  size="lg"
                  onClick={() => handleModeChange(DEPOSIT_MODE.FEES_MEV)}>
                  Deposit
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col">
            <img src={NodeIcon} alt="icon" className="mx-auto mb-6" />
            <div className="earning__mode last">
              <div className="earning__mode__title">Node Operator</div>
              <div className="earning__mode__item">
                <img src={NodeCheckIcon} alt="icon" />
                Earn 50% of Fees and MEV
              </div>
              <div className="earning__mode__item">
                <img src={NodeCheckIcon} alt="icon" />
                Requires 4 ETH
              </div>
            </div>
            {isConnected && (
              <div className="earning__deposit">
                <Button
                  className="node-deposit"
                  size="lg"
                  onClick={() => handleModeChange(DEPOSIT_MODE.NODE_OPERATOR)}>
                  Deposit
                </Button>
              </div>
            )}
          </div>
        </div>
        {!isConnected && (
          <Button size="lg" className="mx-auto" onClick={handleOpenWalletModal}>
            Connect a wallet to continue
          </Button>
        )}
      </div>
      {!isConnected && <div className="content__comment">Connect a wallet for more options.</div>}
      {isConnected && <DepositFooter />}
      <ModalWalletConnect open={openWalletModal} onClose={handleCloseWalletModal} />
    </div>
  )
}
