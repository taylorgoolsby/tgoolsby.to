import gql from 'graphql-tag';

export const typeDefs = gql`
  type Player {
    username: String @sql(type: "VARCHAR(25)", index: true, primary: true)
    status: String @sql(type: "VARCHAR(50)")
    color: String @sql(type: "VARCHAR(7)")
    secret: String @sql(type: "VARCHAR(50)")
    position: JSON @sql(type: "TEXT")
    lookDirection: JSON @sql(type: "TEXT")
    statusMetadata: JSON @sql(type: "TEXT", default: "'{}'")
    memoryMetadata: JSON @sql(type: "TEXT", default: "'{}'")
    initialSetupConversation: String @sql(type: "TEXT")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`;
