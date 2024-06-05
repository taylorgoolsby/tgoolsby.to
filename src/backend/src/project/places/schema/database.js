// @flow

import { format } from '../utils/SqlString.js'

let db: any = null

export function setDB(instance: any) {
  db = instance
}

function flattenSql(queryObject: {
  sql: Array<string>,
  values: Array<string>,
}) {
  // The values of queryObject.sql and queryObject.values are arrays that you would be received by a template tag function.
  // This function flattens them into a single string.

  return format(queryObject.sql, queryObject.values)

  // if (!queryObject.strings) {
  //   return queryObject.sql
  // }
  // let flattened = ''
  // for (let i = 0; i < queryObject.strings.length; i++) {
  //   flattened += queryObject.strings[i]
  //   if (queryObject.values[i]) {
  //     flattened += queryObject.values[i]
  //   }
  // }
  // return flattened.trim()
}

export async function query(queryObject: {
  sql: Array<string>,
  values: Array<string>,
}): any {
  try {
    if (!db) {
      console.error('Database not initialized')
      return
    }

    const sql = flattenSql(queryObject)

    console.log('sql', sql)

    if (typeof window !== 'undefined') {
      // Browser environment
      const stmt = db.prepare(sql)
      stmt.bind(queryObject.values)
      const result = []
      while (stmt.step()) {
        result.push(stmt.getAsObject())
      }
      stmt.free()
      return result
    } else {
      // Node.js environment
      const results = await db.all(sql)
      // console.log('results', results)
      if (sql.startsWith('SELECT')) {
        return results
      } else {
        return results
      }
    }
  } catch (error) {
    console.error('Error executing query:', error)
    throw error
  }
}

const database = {
  query,
  db,
}

export default database
