// @flow

import sqltag, { raw } from 'common/sql-template-tag'
import { query } from '../database.js'
import type { PlayerSQL } from './PlayerSQL.js'

export default class PlayerInterface {
  static async getPlayerData(username: string): Promise<?PlayerSQL> {
    const sql = sqltag`
      SELECT * FROM Player WHERE username = ${username};
    `
    const rows = await query(sql)
    return rows[0]
  }

  static async insertPlayer(
    username: string,
    status: string,
    color: string,
    secret: string,
    position: Array<number>, // integer [x, y, z]
    lookDirection: Array<number>, // integer degrees [rh xy angle, -90/90 azimuth]
    statusMetadata: { [string]: string },
    memoryMetadata: { [string]: string },
    initialSetupConversation: string,
  ): Promise<void> {
    const sql = sqltag`
      INSERT INTO Player (
        username,
        status,
        color,
        secret,
        position,
        lookDirection,
        statusMetadata,
        memoryMetadata,
        initialSetupConversation
      ) VALUES (
        ${username},
        ${status},
        ${color},
        ${secret},
        ${JSON.stringify(position)},
        ${JSON.stringify(lookDirection)},
        ${JSON.stringify(statusMetadata)},
        ${JSON.stringify(memoryMetadata)},
        ${raw(`'${initialSetupConversation.replace(/'/g, "''")}'`)}
      );
    `
    await query(sql)
  }

  static async updateAuth(
    username: string,
    secret: string,
    initialSetupConversation: string,
  ): Promise<void> {
    const sql = sqltag`
      UPDATE Player
      SET secret = ${secret}, 
      initialSetupConversation = ${raw(
        `'${initialSetupConversation.replace(/'/g, "''")}'`,
      )},
      dateUpdated = CURRENT_TIMESTAMP
      WHERE username = ${username};
    `
    await query(sql)
  }

  static async updatePlayerPosition(
    username: string,
    position: string,
    look_direction: string,
  ): Promise<void> {
    const sql = sqltag`
      UPDATE Player
      SET position = ${position}, look_direction = ${look_direction}
      WHERE username = ${username};
    `
    await query(sql)
  }

  static async updateStatusMetadata(
    username: string,
    statusMetadata: { [string]: string },
  ): Promise<void> {
    const sql = sqltag`
      UPDATE player
      SET statusMetadata = ${JSON.stringify(statusMetadata)}
      WHERE username = ${username};
    `
    await query(sql)
  }

  static async updateMemoryMetadata(
    username: string,
    memoryMetadata: { [string]: string },
  ): Promise<void> {
    const sql = sqltag`
      UPDATE player
      SET memoryMetadata = ${JSON.stringify(memoryMetadata)}
      WHERE username = ${username};
    `
    await query(sql)
  }

  static async truncateTable(): Promise<void> {
    const sql = sqltag`DELETE FROM player;`
    await query(sql)
  }
}
