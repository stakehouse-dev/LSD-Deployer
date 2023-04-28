import '../styles.scss'

import { FC, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useConnect } from 'wagmi'

import { ReactComponent as BookIcon } from '@/assets/images/icon-book.svg'
import { ReactComponent as DiscordIcon } from '@/assets/images/icon-discord.svg'
import { ReactComponent as ThreeDotIcon } from '@/assets/images/icon-dot-three.svg'
import { ReactComponent as HelperIcon } from '@/assets/images/icon-helper.svg'
import { ReactComponent as LegalPrivacyIcon } from '@/assets/images/icon-legal-privacy.svg'
import Logo from '@/assets/images/logo.png'
import { ReactComponent as ChartIcon } from '@/assets/images/Poll.svg'
import { ButtonWalletConnect, ModalInsufficientBalance } from '@/components/app'
import ModalLegalPrivacy from '@/components/app/Modals/ModalLegalPrivacy'
import { Dropdown } from '@/components/shared'
import { TMenu } from '@/types'

import NavItem from './NavItem'

const Topbar: FC = () => {
  const { isConnected } = useConnect()
  const { pathname } = useLocation()

  const [openInsufficientModal, setOpenInsufficientModal] = useState(false)

  const [openLegalModal, setOpenLegalModal] = useState(false)

  const options: TMenu[] = [
    {
      id: 0,
      label: 'Monitoring',
      icon: <ChartIcon />,
      onClick: () => window.open('https://joinstakehouse.com/leaderboard', '_blank')
    },
    {
      id: 1,
      label: 'Help Center',
      icon: <HelperIcon />,
      onClick: () =>
        window.open('https://help.joinstakehouse.com/en/collections/3718748-lsd-networks', '_blank')
    },
    {
      id: 2,
      label: 'Docs',
      icon: <BookIcon />,
      onClick: () => window.open('https://docs.joinstakehouse.com/lsd/overview', '_blank')
    },
    {
      id: 3,
      label: 'Discord',
      icon: <DiscordIcon />,
      onClick: () => window.open('https://discord.gg/s8N9ekQuuj', '_blank')
    },
    {
      id: 4,
      label: 'Legal & Risk',
      icon: <LegalPrivacyIcon />,
      onClick: () => setOpenLegalModal(true)
    }
  ]

  const handleCloseLegalModal = () => {
    setOpenLegalModal(false)
  }

  const handleOpenModal = () => setOpenInsufficientModal(true)
  const handleCloseModal = () => setOpenInsufficientModal(false)

  return (
    <div className="topbar">
      <div />
      {/* <a href="https://joinstakehouse.com/" target="_blank" rel={'noopener noreferrer'}>
        <img src={Logo} width={54} alt="logo" />
      </a> */}

      <div className="topbar__navMenu">
        <Link to={'/'}>
          <NavItem active={!pathname.includes('manage')}>Deposit</NavItem>
        </Link>
        <Link to={'/manage'}>
          <NavItem active={pathname.includes('manage')}>Manage</NavItem>
        </Link>
      </div>

      {isConnected ? (
        <div className="flex items-center gap-3">
          <ButtonWalletConnect />
          <Dropdown options={options}>
            <div className="topbar__menu-btn">
              <ThreeDotIcon />
            </div>
          </Dropdown>
        </div>
      ) : (
        <div />
      )}
      <ModalInsufficientBalance open={openInsufficientModal} onClose={handleCloseModal} />
      <ModalLegalPrivacy open={openLegalModal} onClose={handleCloseLegalModal} />
    </div>
  )
}

export default Topbar
