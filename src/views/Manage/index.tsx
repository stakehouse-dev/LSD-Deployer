import './styles.scss'

import { useQuery } from '@apollo/client'
import { ChangeEvent, useState } from 'react'
import tw from 'twin.macro'
import { useConnect } from 'wagmi'

import { ReactComponent as SearchIcon } from '@/assets/images/search.svg'
import { ModalWalletConnect, TableRow } from '@/components/app'
import { TextInput } from '@/components/shared'
import { useCustomAccount } from '@/hooks'

import { FetchMyNetworksQuery } from '../../graphql/queries/LSDNetworks'

export const Manage = () => {
  const [networkSearchKey, setNetworkSearchKey] = useState('')
  const [networkSearchIds, setNetworkSearchIds] = useState<string[]>([])

  const { account } = useCustomAccount()
  const { isConnected } = useConnect()

  const { data: { liquidStakingNetworks: networks } = {}, refetch } = useQuery(
    FetchMyNetworksQuery,
    {
      variables: { address: account?.address },
      skip: !account?.address,
      fetchPolicy: 'network-only'
    }
  )

  const handleFilterNetwork = (e: ChangeEvent<HTMLInputElement>) => {
    setNetworkSearchKey(e.target.value)
    // if (networks && e.target.value) {
    //   setNetworkSearchIds(
    //     networks
    //       .filter((network: any) => network.ticker.toLowerCase().includes(e.target.value.toLowerCase()))
    //       .map((network: any) => network.id)
    //   )
    // } else if (!e.target.value) {
    //   setNetworkSearchIds(networks.map((network) => network.id))
    // } else {
    //   setNetworkSearchIds([])
    // }
  }

  return (
    <div className="manage">
      <div className="content">
        <div className="content__box">
          <div className="w-full text-center text-4xl font-semibold my-4">
            Manage your LSD Network
          </div>
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3" />
            <TextInput
              className="bg-grey850 p-2.5 pl-11 rounded-lg border border-innerBorder outline-none text-sm"
              placeholder="Search network"
              value={networkSearchKey}
              onChange={handleFilterNetwork}
            />
          </div>
          <div className="mt-4 mb-2 rounded-lg border border-innerBorder">
            <table className="w-full table-auto border-collapse">
              <TableHead>
                <tr>
                  <TableHeadCell>#</TableHeadCell>
                  <TableHeadCell>
                    <Label>Owner Address</Label>
                  </TableHeadCell>
                  <TableHeadCell>
                    <Label className="justify-center">Ticker</Label>
                  </TableHeadCell>
                  <TableHeadCell>
                    <Label className="justify-center">Commission</Label>
                  </TableHeadCell>
                  <TableHeadCell>
                    <Label className="justify-center">Validators</Label>
                  </TableHeadCell>
                  <TableHeadCell></TableHeadCell>
                </tr>
              </TableHead>
              <tbody>
                {networks &&
                  networks.length > 0 &&
                  networks.map((network: any, idx: number) => (
                    <TableRow
                      key={idx}
                      order={idx}
                      network={network}
                      disabled={false}
                      onRefresh={refetch}
                    />
                  ))}
              </tbody>
            </table>
            {(!networks || networks.length === 0) && (
              <p className="w-full my-2 text-center text-sm text-grey700">No Networks</p>
            )}
          </div>
        </div>
      </div>
      <ModalWalletConnect open={!isConnected} onClose={() => {}} />
    </div>
  )
}

const TableHead = tw.thead`text-xs font-medium text-grey300 bg-[#20202480]`
const TableHeadCell = tw.th`p-3`
const Label = tw.div`flex items-center gap-2`
