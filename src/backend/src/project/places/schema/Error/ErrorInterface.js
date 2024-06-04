// @flow

import sqltag from 'common/sql-template-tag'
import { query } from '../database.js'

export default class ErrorInterface {
  static async logError(message: string, aiMessage: ?string) {
    const sql = sqltag`
      INSERT INTO error (message, aiMessage) VALUES (${message}, ${aiMessage});
    `
    await query(sql)
  }
}
