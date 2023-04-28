import { FC } from 'react'

import { Button, Spinner } from '@/components/shared'
import { LSD_STATUS } from '@/constants/lsdStatus'
import { useReadyToStake } from '@/hooks'

interface IButtonReadyToStakeProps {
  status: string
  blsPublicKey: string
  alreadyHasStaked: boolean
  onStakeClick: () => void
}

export const ButtonReadyToStake: FC<IButtonReadyToStakeProps> = ({
  status,
  blsPublicKey,
  alreadyHasStaked,
  onStakeClick
}) => {
  const { readyToStake, isLoading } = useReadyToStake(blsPublicKey)

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center">
        <Spinner size={24} />
      </div>
    )
  }

  if (status === LSD_STATUS.READY_TO_STAKE) {
    return (
      <Button disabled={alreadyHasStaked} onClick={onStakeClick}>
        Ready to stake
      </Button>
    )
  }

  if (status === LSD_STATUS.WAITING_FOR_ETH && readyToStake) {
    return (
      <Button disabled={alreadyHasStaked} onClick={onStakeClick}>
        Ready to stake
      </Button>
    )
  }

  return <span className="text-status-waiting">Waiting for ETH</span>
}
