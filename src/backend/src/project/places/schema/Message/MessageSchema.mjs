import gql from 'graphql-tag';

export const typeDefs = gql`
  type Message {
    messageId: Int @sql(type: "INTEGER", primary: true, auto: true)
    username: String @sql(type: "VARCHAR(25)", index: true)
    role: String @sql(type: "VARCHAR(50)")
    content: String @sql(type: "TEXT")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`;
