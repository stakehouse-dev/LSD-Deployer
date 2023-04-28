import gql from 'graphql-tag'

export const GiantSavETHPoolQuery = gql`
  query getGiantSavETHPool {
    giantSavETHPools {
      availableToStake
      sentToLiquidStakingNetworks
      giantLPToken
    }
  }
`
