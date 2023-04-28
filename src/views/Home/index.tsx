import './index.scss'

import { Switch } from '@headlessui/react'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import SafeServiceClient from '@safe-global/safe-service-client'
import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useConnect, useSigner } from 'wagmi'

import { ReactComponent as LogoImage } from '@/assets/images/img.svg'
import { ModalWalletConnect } from '@/components/app'
import { Button, Spinner, TextInput, Tooltip } from '@/components/shared'
import { useCustomAccount, useNetworkBasedLinkFactories, useSDK } from '@/hooks'
import { handleErr, notifyHash, noty } from '@/utils/global'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

type FormType = {
  daoAddress: string
  commission: string
  ticker: string
}

const Home = () => {
  // states
  const [txHash, setTxHash] = useState('')
  const [etherscanLink, setEtherscanLink] = useState('')
  const [gateKeeper, setGateKeeper] = useState(false)
  const [isLoading, setLoading] = useState(false)

  const { lsdWizard } = useSDK()
  const { data: signer } = useSigner()
  const { makeEtherscanLink } = useNetworkBasedLinkFactories()
  const { account, isGnosis, networkList } = useCustomAccount()

  const {
    handleSubmit,
    register,
    reset,
    setValue,
    control,
    formState: { errors }
  } = useForm<FormType>({
    defaultValues: {
      commission: '',
      daoAddress: '',
      ticker: ''
    }
  })

  useEffect(() => {
    if (account) {
      setValue('daoAddress', account.address)
    }
  }, [account])

  useEffect(() => {
    const fetchRealTxHash = async () => {
      if (txHash) {
        if (isGnosis && signer) {
          const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: signer
          })
          const safeService = new SafeServiceClient({
            txServiceUrl: 'https://safe-transaction-goerli.safe.global',
            ethAdapter
          })
          const tx = await safeService.getTransaction(txHash)
          console.log('safe tx: ', tx)
          setEtherscanLink(makeEtherscanLink(tx.transactionHash))
        } else {
          console.log('tx: ', txHash)
          setEtherscanLink(makeEtherscanLink(txHash))
        }
      }
    }

    fetchRealTxHash()
  }, [txHash])

  // wagmi hooks
  const { isConnected } = useConnect()

  const handleCreateNetwork = async (data: FormType) => {
    if (!lsdWizard) return

    const { commission, daoAddress, ticker } = data
    setLoading(true)
    try {
      const tx = await lsdWizard.deployer.deployNewLiquidStakingDerivativeNetwork(
        daoAddress,
        ticker.toUpperCase(),
        commission ? `${Math.floor(parseFloat(commission) * 100000)}` : 0,
        gateKeeper
      )
      notifyHash(tx.hash)
      await tx.wait()
      setTxHash(tx.hash)
    } catch (err) {
      console.log('create network err: ----')
      console.log(err)
      noty(handleErr(err))
    }
    setLoading(false)
    reset()
    setValue('daoAddress', account.address)
  }

  const handleClear = () => {
    setTxHash('')
    setGateKeeper(false)
  }

  return (
    <div className="home">
      <div className="content">
        <div className="earning">
          <div className="flex gap-2">
            <div className="flex-1 flex flex-col items-center gap-2">
              <LogoImage />
              <h1 className="text-4xl font-semibold">Create your LSD Network</h1>
              <p className="text-sm font-medium text-grey700">
                Perfect for DAOs, companies and groups alike
              </p>
              {txHash ? (
                <div className="w-540 bg-black flex flex-col items-center p-6">
                  <p className="text-white text-lg font-bold">Success!</p>
                  <span className="text-grey300 font-medium text-center mb-7">
                    {`You've created your LSD Network.`}
                  </span>
                  <div className="flex gap-3">
                    <a href={etherscanLink} target="_blank" rel="noreferrer">
                      <Button variant="secondary">Etherscan</Button>
                    </a>
                    <Button onClick={handleClear}>Home</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full">
                    <TextInput
                      label="LSD Network Owner Address"
                      placeholder="| ex. 0x345627340204823747234823"
                      tooltip="A Gnosis Safe or DAO treasury address is recommended."
                      className="bg-black p-2.5 pl-4 rounded-lg border border-innerBorder outline-none text-sm"
                      {...register('daoAddress', { required: true })}
                    />
                    {errors.daoAddress && (
                      <p className="text-sm text-error">DAO Address required</p>
                    )}
                  </div>
                  <div className="w-full">
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          label="Commission"
                          placeholder="| 0.2%"
                          tooltip="Commissions are taken from Node Operators and Fees and MEV stakers."
                          type="number"
                          className="bg-black p-2.5 pl-4 rounded-lg border border-innerBorder outline-none text-sm"
                          value={value}
                          onChange={(e) =>
                            onChange(Math.floor(parseFloat(e.target.value) * 100000) / 100000)
                          }
                        />
                      )}
                      name="commission"
                      rules={{ max: 100, min: 1 }}
                    />
                    {errors.commission && (
                      <p className="text-sm text-error">
                        Commission should be a number from 1 to 100.
                      </p>
                    )}
                  </div>
                  <div className="w-full">
                    <TextInput
                      label="Ticker"
                      placeholder="| ex. WAGYU"
                      style={{ textTransform: 'uppercase' }}
                      tooltip="Ticker can be five characters maximum."
                      className="bg-black p-2.5 pl-4 rounded-lg border border-innerBorder outline-none text-sm"
                      {...register('ticker', {
                        required: true,
                        minLength: 3,
                        maxLength: 5,
                        pattern: /^[A-Za-z]+$/,
                        validate: (value) => !networkList.includes(value.toLowerCase())
                      })}
                    />
                    {errors.ticker?.type === 'required' && (
                      <p className="text-sm text-error">Ticker required</p>
                    )}
                    {errors.ticker?.type === 'pattern' && (
                      <p className="text-sm text-error">Ticker should be alphabet only</p>
                    )}
                    {errors.ticker?.type === 'maxLength' && (
                      <p className="text-sm text-error">
                        The length of ticker should be less than 5
                      </p>
                    )}
                    {errors.ticker?.type === 'minLength' && (
                      <p className="text-sm text-error">
                        The length of ticker should be more than 3
                      </p>
                    )}
                    {errors.ticker?.type === 'validate' && (
                      <p className="text-sm text-error">The ticket name already exists</p>
                    )}
                  </div>
                  <div className="w-full flex items-center gap-3 my-3">
                    <p className="text-sm text-grey600">Deploy Gatekeeping</p>
                    <Tooltip message="Decide who can join your LSD Network." />
                    <Switch
                      checked={gateKeeper}
                      onChange={setGateKeeper}
                      className={classNames(
                        gateKeeper ? 'bg-primary' : 'bg-black',
                        'relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                      )}>
                      <span
                        aria-hidden="true"
                        className={classNames(
                          gateKeeper ? 'translate-x-5' : 'translate-x-0',
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                        )}
                      />
                    </Switch>
                  </div>
                  <div className="w-full">
                    <Button
                      onClick={handleSubmit(handleCreateNetwork)}
                      disabled={isLoading}
                      className="stake-deposit w-full flex justify-center"
                      size="lg">
                      {isLoading ? <Spinner size={22} /> : 'Create'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <ModalWalletConnect open={!isConnected} onClose={() => {}} />
    </div>
  )
}
export default Home
