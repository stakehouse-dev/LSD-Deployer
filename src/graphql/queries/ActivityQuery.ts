import gql from 'graphql-tag'

export const ActivityQuery = gql`
  query Activity($account: String!) {
    events(
      where: {
        key_in: [
          "ETH_DEPOSITED_BY_STAKER"
          "LP_BURNED_FOR_ETH"
          "GIANT_LP_SWAPPED"
          "SMART_WALLET_CREATED"
          "NEW_VALIDATOR_REGISTERED"
          "LP_TOKEN_ISSUED"
          "LP_TOKEN_MINTED"
          "KNOT_STAKED"
          "STAKEHOUSE_CREATED"
          "STAKEHOUSE_JOINED"
          "DETH_CLAIMED"
          "FEES_AND_MEV_CLAIMED"
          "NODE_RUNNER_REWARDS_CLAIMED"
        ]
        from: $account
      }
      orderBy: blockNumber
      orderDirection: desc
    ) {
      id
      key
      value
      blsPubKeyForKnot
      blockNumber
    }
  }
`
