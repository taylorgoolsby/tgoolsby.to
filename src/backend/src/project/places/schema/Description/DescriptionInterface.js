// @flow

import sqltag from 'common/sql-template-tag'
import { query } from '../database.js'
import type { DescriptionSQL } from './DescriptionSQL.js'

export default class DescriptionInterface {
  static async storeTextDescription(
    position: Array<number>,
    lookDirection: Array<number>,
    description: string,
  ): Promise<void> {
    const sql = sqltag`
      INSERT INTO description (
        positionX,
        positionY, 
        positionZ,  
        lookDirectionAngle,
        lookDirectionAzimuth,
        description
      ) VALUES (
        ${position[0]},
        ${position[1]},
        ${position[2]}, 
        ${lookDirection[0]},
        ${lookDirection[1]}, 
        ${description}
      );
    `
    await query(sql)
  }
}
