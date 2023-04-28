import { useQuery } from '@apollo/client'
import { ChangeEvent, FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tw, { styled } from 'twin.macro'
import { useBlockNumber } from 'wagmi'

import AsssetDetailsSVG from '@/assets/images/asset-details.svg'
import { ReactComponent as SearchIcon } from '@/assets/images/search.svg'
import { ModalApproveMint, ModalValidatorMint, ModalValidatorStake } from '@/components/app/Modals'
import { Button, ClipboardCopy, TextInput, Tooltip } from '@/components/shared'
import { BEACON_NODE_URL } from '@/constants/chains'
import { LSD_STATUS } from '@/constants/lsdStatus'
import { LsdValidatorsQuery } from '@/graphql/queries/lsdValidators'
import { useAvailableToStake, useFetchLsdValidators, useInProgress, useSDK } from '@/hooks'
import { ValidatorLifecycleStatuses, ValidatorT } from '@/types'
import { humanReadableAddress } from '@/utils/global'

import { ButtonReadyToStake } from '../Buttons'

type ValidatorStatusProps = {
  id: string
  status: string
  alreadyHasStaked: boolean
  onMintClick: () => void
  onStakeClick: () => void
}

const ValidatorStatus: FC<ValidatorStatusProps> = ({
  id,
  status,
  alreadyHasStaked,
  onMintClick,
  onStakeClick
}) => {
  const { data } = useBlockNumber()
  const { data: sValidators } = useQuery(LsdValidatorsQuery, {
    variables: { blsPublicKey: id },
    skip: !id,
    fetchPolicy: 'network-only'
  })

  const sValidator: ValidatorT = sValidators?.stakehouseAccounts
    ? sValidators?.stakehouseAccounts[0]
    : null

  if (
    sValidator &&
    data &&
    sValidator.mintFromBlockNumber &&
    sValidator.lifecycleStatus === ValidatorLifecycleStatuses.depositCompleted &&
    data > Number(sValidator.mintFromBlockNumber)
  ) {
    return <Button onClick={onMintClick}>Minting Available</Button>
  }

  switch (status) {
    case LSD_STATUS.STAKED:
      return <span>STAKED</span>
    case LSD_STATUS.BANNED:
      return <span className="text-error">BANNED</span>
    case LSD_STATUS.DERIVATIVES_MINTED:
      return <span>MINTED</span>
    case LSD_STATUS.WAITING_FOR_ETH:
    case LSD_STATUS.READY_TO_STAKE:
      return (
        <ButtonReadyToStake
          alreadyHasStaked={alreadyHasStaked}
          blsPublicKey={id}
          status={status}
          onStakeClick={onStakeClick}
        />
      )
  }

  return <></>
}

export const Validators: FC = () => {
  const navigate = useNavigate()
  const { validators, networks, handleRefresh } = useFetchLsdValidators()
  const { amount: availableToStake } = useAvailableToStake('Main')
  const { amount: inProgress } = useInProgress('Main')
  const { amount: stakingOpenPoolETH } = useAvailableToStake('Staking')
  const { amount: stakingInProgress } = useInProgress('Staking')
  const { amount: feesMevOpenPoolETH } = useAvailableToStake('FeesMev')
  const { amount: feesMevInProgress } = useInProgress('FeesMev')

  const { sdk } = useSDK()

  const [selectedValidator, setSelectedValidator] = useState<string>('')
  const [selectedValidatorForMint, setSelectedValidatorForMint] = useState<string>('')
  const [networkSearchIds, setNetworkSearchIds] = useState<string[]>([])
  const [networkSearchKey, setNetworkSearchKey] = useState('')
  const [approving, setApproving] = useState(false)
  const [failedApprove, setFailedApprove] = useState(false)

  useEffect(() => {
    if (networks.length > 0) {
      setNetworkSearchIds(networks.map((network) => network.id))
    }
  }, [networks])

  const handleGoNodeRunner = () => {
    navigate('/node_operator')
  }

  const handleFilterNetwork = (e: ChangeEvent<HTMLInputElement>) => {
    setNetworkSearchKey(e.target.value)
    if (networks && e.target.value) {
      setNetworkSearchIds(
        networks
          .filter((network) => network.ticker.toLowerCase().includes(e.target.value.toLowerCase()))
          .map((network) => network.id)
      )
    } else if (!e.target.value) {
      setNetworkSearchIds(networks.map((network) => network.id))
    } else {
      setNetworkSearchIds([])
    }
  }

  const handleMint = async (blsPublicKey: string) => {
    if (!sdk) return

    try {
      setApproving(true)
      const finalisedEpochReport = await sdk.balanceReport.getFinalisedEpochReport(
        BEACON_NODE_URL,
        blsPublicKey
      )
      const { activationEpoch, currentCheckpointEpoch, activeBalance } = finalisedEpochReport
      if (
        Number(activationEpoch) < Number(currentCheckpointEpoch) &&
        Number(activeBalance) >= Number('32000000000')
      ) {
        setTimeout(() => {
          setSelectedValidatorForMint(blsPublicKey)
        }, 500)
      } else {
        setFailedApprove(true)
      }
    } catch (err) {
      console.log('approve minting error--------')
      console.log(err)
      setFailedApprove(true)
    }
    setApproving(false)
  }

  const alreadyHasStaked =
    validators.findIndex((validator) => validator.status === LSD_STATUS.STAKED) > -1 ||
    availableToStake + inProgress < 28 ||
    stakingOpenPoolETH + stakingInProgress < 24 ||
    feesMevOpenPoolETH + feesMevInProgress < 4

  return (
    <>
      <ModalApproveMint
        open={approving || failedApprove}
        approving={approving}
        failedApprove={failedApprove}
        onClose={() => {
          setApproving(false)
          setFailedApprove(false)
        }}
      />
      <ModalValidatorMint
        open={!!selectedValidatorForMint}
        blsPublicKey={selectedValidatorForMint}
        onMinted={() => {
          setSelectedValidatorForMint('')
          handleRefresh()
        }}
        onClose={() => setSelectedValidatorForMint('')}
      />
      <ModalValidatorStake
        open={!!selectedValidator}
        blsPublicKey={selectedValidator}
        onStaked={() => {
          setSelectedValidator('')
          handleRefresh()
        }}
        onClose={() => setSelectedValidator('')}
      />
      <div className="relative w-full mt-3.5">
        <SearchIcon className="absolute left-3.5 top-3" />
        <TextInput
          className="bg-grey850 p-2.5 pl-11 rounded-lg border border-innerBorder outline-none text-sm"
          placeholder="Search network"
          value={networkSearchKey}
          onChange={handleFilterNetwork}
        />
      </div>
      {validators.length > 0 ? (
        <div className="mt-4 mb-2 rounded-lg overflow-hidden border border-innerBorder">
          <table className="w-full table-auto border-collapse">
            <TableHead>
              <tr>
                <TableHeadCell>#</TableHeadCell>
                <TableHeadCell>
                  <Label>Validator Address</Label>
                </TableHeadCell>
                <TableHeadCell>
                  <Label className="justify-center">Status</Label>
                </TableHeadCell>
                <TableHeadCell>
                  <Label className="justify-center">LSD Network</Label>
                </TableHeadCell>
              </tr>
            </TableHead>
            <tbody>
              {validators
                .filter((validator) => networkSearchIds.includes(validator.liquidStakingManager))
                .map((validator, index) => (
                  <tr
                    key={validator.id}
                    className="border-t border-innerBorder text-sm font-medium">
                    <TableCell>{index}</TableCell>
                    <TableCell>
                      <ClipboardCopy copyText={validator.id}>
                        {humanReadableAddress(validator.id, 9)}
                      </ClipboardCopy>
                    </TableCell>
                    <TableCell className="text-center">
                      <ValidatorStatus
                        id={validator.id}
                        status={validator.status}
                        alreadyHasStaked={alreadyHasStaked}
                        onMintClick={() => handleMint(validator.id)}
                        onStakeClick={() => setSelectedValidator(validator.id)}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {
                        networks.find((network) => network.id === validator.liquidStakingManager)
                          ?.ticker
                      }
                    </TableCell>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Box>
          <img src={AsssetDetailsSVG} alt="asset details" />
          <div className="text-sm font-medium">
            Valdiators are only available for Node Operators
          </div>
          <Button size="lg" onClick={handleGoNodeRunner}>
            Earn as a Node Operator
          </Button>
        </Box>
      )}
    </>
  )
}

const TableHead = tw.thead`text-xs font-medium text-grey300 bg-[#20202480]`
const TableHeadCell = tw.th`px-6 py-3`
const Label = tw.div`flex items-center gap-2`
const TableCell = tw.td`px-6 content-center h-16`
const Box = styled.div`
  ${tw`mx-2 mt-2 border border-solid rounded-lg border-innerBorder flex flex-col items-center gap-8 py-12`}

  img {
    width: 158px;
    height: 80px;
  }
`
