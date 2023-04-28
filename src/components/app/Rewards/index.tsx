import 'twin.macro'
import './index.scss'

import { FC, useState } from 'react'
import { useParams } from 'react-router-dom'

import FeesIcon from '@/assets/images/icon-fees.svg'
import NodeIcon from '@/assets/images/icon-node.svg'
import StakeIcon from '@/assets/images/icon-stake.svg'
import RewardMode from '@/components/app/Rewards/RewardMode'
import { WITHDRAW_MODE } from '@/constants'

const modes = [
  { label: 'Protected Staking', mode: WITHDRAW_MODE.STAKING, src: StakeIcon },
  { label: 'Fees and MEV', mode: WITHDRAW_MODE.FEES_MEV, src: FeesIcon },
  { label: 'Node Operators', mode: WITHDRAW_MODE.NODE_OPERATOR, src: NodeIcon }
]

const Rewards: FC = () => {
  const params = useParams()
  const [isOpen, setIsOpen] = useState<boolean>(!!params.activeMode)
  const [activeMode, setActiveMode] = useState<WITHDRAW_MODE | null>(
    params.activeMode as WITHDRAW_MODE
  )

  const handleOpen = (mode: WITHDRAW_MODE) => {
    if (activeMode === mode) setIsOpen(!isOpen)
    else {
      setIsOpen(true)
      setActiveMode(mode)
    }
  }

  return (
    <div className="p-4 mt-4">
      <div className="flex flex-col gap-4">
        {modes.map((item, index) => {
          const isActive = item.mode === activeMode && isOpen
          return (
            <RewardMode
              key={index}
              isActive={isActive}
              label={item.label}
              mode={item.mode}
              handleOpen={handleOpen}
              src={item.src}
            />
          )
        })}
      </div>
    </div>
  )
}

export default Rewards
