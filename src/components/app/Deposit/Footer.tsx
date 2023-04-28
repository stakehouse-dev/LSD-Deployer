import 'twin.macro'

import { FC, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as ArrowTopRightIcon } from '@/assets/images/icon-arrow-top-right.svg'
import { ReactComponent as DEthIcon } from '@/assets/images/icon-deth.svg'
import { ReactComponent as EthIcon } from '@/assets/images/icon-eth.svg'
import { WITHDRAW_MODE } from '@/constants'
import { RewardsContext } from '@/context/RewardsContext'
import { useAvailableToStake, useInProgress, useRewardBalance } from '@/hooks'

import { roundNumber } from '../../../utils/global'

interface IDepositFooter {
  from?: 'Node Runner' | 'Staking' | 'FeesMev' | 'Main'
}

export const DepositFooter: FC<IDepositFooter> = ({ from = 'Main' }) => {
  const navigate = useNavigate()

  const { amount: stakingETH } = useAvailableToStake('Staking')
  const { amount: feesMevETH } = useAvailableToStake('FeesMev')
  const { amount: availableToStake } = useAvailableToStake(from)
  const { amount: inProgress } = useInProgress(from)
  const { rewards } = useContext(RewardsContext)

  const handleGoRewardStaking = () => {
    navigate('/manage/rewards/staking')
  }

  const handleGoRewardFees = () => {
    navigate('/manage/rewards/fees')
  }

  return (
    <div className="content__status">
      {from === 'Main' && (
        <>
          <div className="flex justify-between">
            <div className="content__status__label">
              <EthIcon />
              ETH in Open Staked Pool
            </div>
            <div className="content__status__value">
              {stakingETH.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH
            </div>
          </div>
          <div className="flex justify-between">
            <div className="content__status__label">
              <EthIcon />
              ETH in Open MEV Pool
            </div>
            <div className="content__status__value">
              {feesMevETH.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH
            </div>
          </div>
        </>
      )}
      {from !== 'Main' && (
        <div className="flex justify-between">
          <div className="content__status__label">
            <EthIcon />
            ETH in Open Pool
          </div>
          <div className="content__status__value">
            {availableToStake.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH
          </div>
        </div>
      )}
      <div className="flex justify-between">
        <div className="content__status__label">
          <EthIcon />
          ETH being Staked
        </div>
        <div className="content__status__value">
          {inProgress.toLocaleString(undefined, { maximumFractionDigits: 4 })} ETH
        </div>
      </div>
      <div className="content__status__box">
        <div className="flex justify-between">
          <div className="content__status__label">
            <DEthIcon />
            Available to Claim
          </div>
          <div
            className={`content__status__value cursor-pointer ${
              Number(rewards?.staking || 0) > 0 && 'positive'
            }`}
            onClick={handleGoRewardStaking}>
            {roundNumber(rewards?.staking || 0, 3)} dETH <ArrowTopRightIcon />
          </div>
        </div>
        <div className="flex justify-between">
          <div className="content__status__label">
            <EthIcon />
            Available to Claim
          </div>
          <div
            className={`content__status__value cursor-pointer ${
              Number(rewards?.feesMev || 0) > 0 && 'positive'
            }`}
            onClick={handleGoRewardFees}>
            {roundNumber(rewards?.feesMev || 0, 3)} ETH <ArrowTopRightIcon />
          </div>
        </div>
      </div>
    </div>
  )
}
