import gql from 'graphql-tag';

export const typeDefs = gql`
  type Error {
    errorId: Int @sql(type: "INTEGER", primary: true, auto: true)
    message: String @sql(type: "TEXT")
    aiMessage: String @sql(type: "TEXT", nullable: true)
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`;
