// @flow

import sqlDirective from 'graphql-to-sql';
import gql from 'graphql-tag';
import fs from 'fs';
import * as Player from './Player/PlayerSchema.mjs';
import * as Description from './Description/DescriptionSchema.mjs';
import * as Error from './Error/ErrorSchema.mjs';
import * as Version from './Version/VersionSchema.mjs';

import path from 'path'
import { fileURLToPath } from 'url'
// $FlowFixMe
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const {
  sqlDirectiveTypeDefs,
  generateSql
} = sqlDirective('sql');

const typeDefs = gql`
  scalar JSON
  
  directive @sql (
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

  # See graphql-directive-private
  directive @private on OBJECT | FIELD_DEFINITION

  ${Player.typeDefs}
  ${Description.typeDefs}
  ${Error.typeDefs}
  ${Version.typeDefs}
`;

const sql = generateSql({ typeDefs: [typeDefs, sqlDirectiveTypeDefs] }, {
  databaseName: null,
  tablePrefix: null,
  dbType: 'sqlite'
});
console.log('sql', sql);

const sqlModule = `export default \`${sql.replaceAll('`', '\\`')}\``;

fs.writeFileSync(path.resolve(__dirname, './createTables.js'), sqlModule, 'utf8');
