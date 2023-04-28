import { FC, ReactNode } from 'react'
import tw from 'twin.macro'

import { ReactComponent as DEthIcon } from '@/assets/images/icon-deth.svg'
import { ReactComponent as EthIcon } from '@/assets/images/icon-eth.svg'
import { WITHDRAW_MODE } from '@/constants'
import { useWithdrawBalance } from '@/hooks'

const positions = [
  {
    label: 'Staked Position',
    subPositions: [
      { label: 'Protected Staking LP', mode: WITHDRAW_MODE.STAKING, icon: <DEthIcon /> },
      { label: 'Fees and MEV LP', mode: WITHDRAW_MODE.FEES_MEV },
      { label: 'Node Operator', mode: WITHDRAW_MODE.NODE_OPERATOR }
    ]
  }
]

const StatSubItem: FC<{ label: string; mode: WITHDRAW_MODE; icon: ReactNode | undefined }> = ({
  label,
  mode,
  icon
}) => {
  const { balance } = useWithdrawBalance(mode)

  return (
    <div className="flex justify-between py-2 text-grey700">
      <span className="flex items-center gap-1">
        {icon ? icon : <EthIcon />}
        {label}
      </span>
      <span>{balance} ETH</span>
    </div>
  )
}

export const Positions: FC = () => {
  const { balance: totalBalance } = useWithdrawBalance()
  return (
    <div className="w-full px-4 mt-4 text-sm font-medium">
      {positions.map((item) => (
        <div key={item.label} className="w-full flex flex-col">
          <StatItem className="my-1">
            <span>{item.label}</span>
            <span>{totalBalance} ETH</span>
          </StatItem>
          <div className="">
            {item.subPositions.map((subItem, index) => (
              <StatSubItem
                key={index}
                label={subItem.label}
                mode={subItem.mode}
                icon={subItem.icon}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const StatItem = tw.div`flex justify-between py-2`
