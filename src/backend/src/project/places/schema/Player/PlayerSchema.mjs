// @flow

import gql from 'graphql-tag';

export const typeDefs = gql`
  type Player {
    playerId: Int @sql(type: "INT", primary: true, auto: true)
    username: String @sql(type: "VARCHAR(25)")
    status: String @sql(type: "VARCHAR(50)")
    color: String @sql(type: "VARCHAR(7)")
    secret: String @sql(type: "VARCHAR(50)")
    position: JSON @sql(type: "TEXT")
    look_direction: JSON @sql(type: "TEXT")
    statusMetadata: JSON @sql(type: "TEXT", default: "'{}'")
    memoryMetadata: JSON @sql(type: "TEXT", default: "'{}'")
    initialSetupConversation: String @sql(type: "TEXT")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`;
