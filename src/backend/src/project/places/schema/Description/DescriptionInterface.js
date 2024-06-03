// @flow

import sqltag from 'common/sql-template-tag';
import { query } from '../database.js';
import type {DescriptionSQL} from "./DescriptionSQL.js";

export default class DescriptionInterface {
  static async storeTextDescription(position, look_direction, description) {
    const sql = sqltag`
      INSERT INTO description (position, look_direction, description) VALUES (${JSON.stringify(position)}, ${JSON.stringify(look_direction)}, ${description});
    `;
    await query(sql);
  }
}
