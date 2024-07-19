// @flow

import sqltag, { raw } from 'common/sql-template-tag'
import { query } from '../database.js'
import type { DescriptionSQL } from './DescriptionSQL.js'

export default class DescriptionInterface {
  static async get(
    positionX: number,
    positionY: number,
    positionZ: number,
  ): Promise<?DescriptionSQL> {
    const sql = sqltag`
      SELECT * FROM description
      WHERE positionX = ${positionX}
      AND positionY = ${positionY}
      AND positionZ = ${positionZ};
    `
    const rows = await query(sql)
    return rows[0]
  }

  static async update(
    position: Array<number>,
    description: string,
  ) {
    const sql = sqltag`
      UPDATE description
      SET text = ${raw(`'${description.replace(/'/g, "''")}'`)},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE positionX = ${position[0]}
      AND positionY = ${position[1]}
      AND positionZ = ${position[2]};
    `
    await query(sql)
  }

  static async insert(
    position: Array<number>,
    description: string,
  ) {
    const sql = sqltag`
      INSERT INTO description (
        positionX,
        positionY, 
        positionZ,  
        text
      ) VALUES (
        ${position[0]},
        ${position[1]},
        ${position[2]}, 
        ${raw(`'${description.replace(/'/g, "''")}'`)}
      );
    `
    await query(sql)
  }
}
