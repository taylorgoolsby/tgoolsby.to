// @flow

import sqltag from 'common/sql-template-tag';
import { query } from '../database.js';

export default class ErrorInterface {
  static async logError(error_message) {
    const sql = sqltag`
      INSERT INTO error (message) VALUES (${error_message});
    `;
    await query(sql);
  }
}
