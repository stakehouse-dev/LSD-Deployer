import './styles.scss'

import { FC, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDisconnect } from 'wagmi'

import EthProfitIcon from '@/assets/images/profit.png'
import { ModalAccount } from '@/components/app'
import { Button } from '@/components/shared'
import { StakingStoreContext } from '@/context/StakingStoreContext'
import { useCustomAccount } from '@/hooks'

const ButtonWalletConnect: FC = () => {
  const navigate = useNavigate()
  const { account } = useCustomAccount()
  const { disconnect } = useDisconnect()
  const { clearAllData } = useContext(StakingStoreContext)
  const [openAccountModal, setOpenAccountModal] = useState(false)

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on!('accountsChanged', (accounts: any) => {
        disconnect()
      })
    }
  }, [])

  const handleDisconnect = () => {
    clearAllData()
    setOpenAccountModal(false)
    disconnect()
  }

  const handleGoRewardFees = () => {
    navigate('/manage')
  }

  if (account) {
    return (
      <>
        <Button variant="secondary" onClick={handleGoRewardFees}>
          <div className="-mx-1">
            <img src={EthProfitIcon} width={21} alt="profit_icon" />
          </div>
        </Button>
        <Button variant="secondary" onClick={() => setOpenAccountModal(true)}>
          <div className="connect-wallet--secondary flex items-center gap-1 -mx-2">
            {`${account.address!.slice(0, 4)}...${account.address!.slice(-2)}`}
          </div>
        </Button>
        <ModalAccount
          open={openAccountModal}
          onClose={() => setOpenAccountModal(false)}
          accountAddress={account.address!}
          onDisconnect={handleDisconnect}
        />
      </>
    )
  }

  return <></>
}

export default ButtonWalletConnect
