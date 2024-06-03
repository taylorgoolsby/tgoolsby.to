// @flow

import sqltag from 'common/sql-template-tag';
import { query } from '../database.js';
import type {PlayerSQL} from "./PlayerSQL.js";

export default class PlayerInterface {
  static async getPlayerData(username: string): Promise<?PlayerSQL> {
    const sql = sqltag`
      SELECT * FROM Player WHERE username = ${username};
    `;
    const rows = await query(sql);
    return rows[0];
  }

  static async insertPlayer(
    username: string,
    status: string,
    color: string,
    secret: string,
    position: string,
    look_direction: string,
    statusMetadata: string,
    memoryMetadata: string,
    initialSetupConversation: string,
  ): Promise<void> {
    const sql = sqltag`
      INSERT INTO Player (
        username,
        status,
        color,
        secret,
        position,
        look_direction,
        statusMetadata,
        memoryMetadata,
        initialSetupConversation
      ) VALUES (
        ${username},
        ${status},
        ${color},
        ${secret},
        ${position},
        ${look_direction},
        ${statusMetadata},
        ${memoryMetadata},
        ${initialSetupConversation}
      );
    `;
    await query(sql);
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
    `;
    await query(sql);
  }

  static async updatePlayerMetadata(
    username: string,
    statusMetadata: string,
    memoryMetadata: string,
  ): Promise<void> {
    const sql = sqltag`
      UPDATE player
      SET statusMetadata = ${statusMetadata}, memoryMetadata = ${memoryMetadata}
      WHERE username = ${username};
    `;
    await query(sql);
  }

  static async truncateTable(): Promise<void> {
    const sql = sqltag`DELETE FROM player;`;
    await query(sql);
  }
}
