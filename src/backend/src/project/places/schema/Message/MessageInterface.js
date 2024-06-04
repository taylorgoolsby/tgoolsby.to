// @flow

import sqltag from 'common/sql-template-tag'
import { query } from '../database.js'
import type { MessageSQL } from './MessageSQL.js'

export default class MessageInterface {
  static async getGlobalHistory(): Promise<Array<MessageSQL>> {
    const sql = sqltag`
      SELECT * FROM Message
      WHERE role = 'user'
      ORDER BY dateCreated ASC
      LIMIT 100;
    `
    return await query(sql)
  }

  static async getHistory(username: string): Promise<Array<MessageSQL>> {
    const sql = sqltag`
      SELECT * FROM Message
      WHERE username = ${username}
      ORDER BY dateCreated ASC;
    `
    return await query(sql)
  }
}
