// @flow

import gql from 'graphql-tag'
import GraphQLJSON from 'graphql-type-json'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { createIdDirective } from 'graphql-directive-id'
import privateDirective from 'graphql-directive-private'
// import { paginationDirectiveTransform } from '../utils/pagination.js'
import * as Player from './Player/PlayerSchema.mjs'
import * as Description from './Description/DescriptionSchema.mjs'
import * as Error from './Error/ErrorSchema.mjs'
import * as Message from './Message/MessageSchema.mjs'
import * as Version from './Version/VersionSchema.mjs'
// import type { ResolverDefs } from '../utils/resolver.js'
// import resolver from '../utils/resolver.js'
// import createViewer from '../utils/createViewer.js'
// import InferenceRest from '../rest/InferenceRest.js'
// import UserInterface from './User/UserInterface.js'

const { idDirectiveTransformer } = createIdDirective('id')
const { privateDirectiveTransform } = privateDirective('private')

export const typeDefs: any = gql`
  scalar JSON

  directive @sql(
    unicode: Boolean
    auto: Boolean
    default: String
    index: Boolean
    nullable: Boolean
    primary: Boolean
    type: String
    unique: Boolean
    generated: String
    constraints: String
  ) on OBJECT | FIELD_DEFINITION

  # See graphql-directive-id
  directive @id(from: [String], name: String) on OBJECT

  # See graphql-directive-private
  directive @private on OBJECT | FIELD_DEFINITION

  # See graphql-directive-pagination
  directive @pagination on FIELD_DEFINITION

  ${Player.typeDefs}
  ${Description.typeDefs}
  ${Error.typeDefs}
  ${Message.typeDefs}
  ${Version.typeDefs}

  type Query {
    viewer: Int
  }
`

// $FlowFixMe
export const resolvers: ResolverDefs = {
  Query: {
    viewer: () => 0,
  },
  JSON: GraphQLJSON,
}

let _schema: any = makeExecutableSchema({
  typeDefs,
  resolvers,
})

_schema = idDirectiveTransformer(_schema)
// _schema = paginationDirectiveTransform(_schema, resolvers)
_schema = privateDirectiveTransform(_schema)

// console.log('printSchemaWithDirectives(schema)', printSchemaWithDirectives(_schema))

export const schema: any = _schema
