// @flow

import sqltag, { raw } from 'common/sql-template-tag'
import { query } from '../database.js'
import type { DescriptionSQL } from './DescriptionSQL.js'

export default class DescriptionInterface {
  static async storeOrUpdateTextDescription(
    position: Array<number>,
    lookDirection: Array<number>,
    description: string,
  ): Promise<void> {
    const existingDescription = await DescriptionInterface.get(
      position[0],
      position[1],
      position[2],
    )

    if (!existingDescription) {
      const sql = sqltag`
        INSERT INTO description (
          positionX,
          positionY, 
          positionZ,  
          lookDirectionAngle,
          lookDirectionAzimuth,
          text
        ) VALUES (
          ${position[0]},
          ${position[1]},
          ${position[2]}, 
          ${lookDirection[0]},
          ${lookDirection[1]}, 
          ${raw(`'${description.replace(/'/g, "''")}'`)}
        );
      `
      await query(sql)
    } else {
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
  }

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
}
