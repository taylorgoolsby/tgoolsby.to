import gql from 'graphql-tag';

export const typeDefs = gql`
  type Description @sql(constraints: "UNIQUE(positionX, positionY, positionZ)") {
    descriptionId: Int @sql(type: "INTEGER", primary: true, auto: true)
    positionX: Int @sql(type: "INTEGER", index: true)
    positionY: Int @sql(type: "INTEGER", index: true)
    positionZ: Int @sql(type: "INTEGER", index: true)
    lookDirectionAngle: Int @sql(type: "INTEGER")
    lookDirectionAzimuth: Int @sql(type: "INTEGER")
    text: String @sql(type: "TEXT")
    embedding: JSON @sql(type: "TEXT", nullable: true)
    imageUrl: String @sql(type: "TEXT", nullable: true)
    dateUpdated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
    dateCreated: String @sql(type: "TIMESTAMP", default: "CURRENT_TIMESTAMP")
  }
`;
