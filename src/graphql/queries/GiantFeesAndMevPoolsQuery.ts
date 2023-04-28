import gql from 'graphql-tag'

export const GiantFeesAndMevPoolsQuery = gql`
  query getGiantFeesAndMevPool {
    giantFeesAndMevPools {
      availableToStake
      sentToLiquidStakingNetworks
    }
  }
`
