import gql from 'graphql-tag'

export const NodeRunnersQuery = gql`
  query getNodeRunnersQuery($address: String!, $status: String!) {
    nodeRunners(where: { id: $address }) {
      id
      validators(where: { status: $status }) {
        status
      }
    }
  }
`

export const AllNodeRunnersQuery = gql`
  query getAllNodeRunnersQuery($address: String!) {
    nodeRunners(where: { id: $address }) {
      id
      validators {
        id
        status
        liquidStakingManager
      }
      liquidStakingNetworks {
        id
        ticker
      }
    }
  }
`
