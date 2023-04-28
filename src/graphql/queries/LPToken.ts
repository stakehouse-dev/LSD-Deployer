import gql from 'graphql-tag'

export const LPTokenQuery = gql`
  query lptokens($liquidStakingManager: Bytes!, $type: String!) {
    lptokens(
      where: {
        tokenType: $type
        giantPoolBalance_gt: 0
        liquidStakingNetwork_: { id: $liquidStakingManager }
      }
    ) {
      id
      tokenType
      giantPoolBalance
    }
  }
`
