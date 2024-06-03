// @flow

import gql from 'graphql-tag';

export const typeDefs = gql`
  type Description {
    descriptionId: Int @sql(type: "INTEGER", primary: true, auto: true)
    position: JSON @sql(type: "TEXT")
    look_direction: JSON @sql(type: "TEXT")
    description: String @sql(type: "TEXT")
    embedding: JSON @sql(type: "TEXT")
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`;
