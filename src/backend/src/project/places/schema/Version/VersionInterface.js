// @flow

import sqltag, { join } from 'common/sql-template-tag'
import database from "../database.js";

export type VersionSQL = {
  version: string,
  stage: string,
  isMigrated: boolean,
  migrationScript: string,
  dateUpdated: string,
  dateCreated: string,
}

function getVersion() {
  const appVersion = '0.0'
  const version = appVersion
  return version
}

export default class VersionInterface {
  static async getCurrent(): Promise<?VersionSQL> {
    const version = getVersion()
    const query = sqltag`
      SELECT * FROM Version
      WHERE version = ${version}
      AND stage = 'prod'
      ORDER BY dateCreated;
    `
    const rows = await database.query(query)
    return rows[0]
  }

  static async insertCurrentVersion(): Promise<void> {
    const version = getVersion()
    const sql = sqltag`
      SELECT * FROM Version
      WHERE version = ${version};
    `

    const rows = await database.query(sql)
    if (!rows.length) {
      const query = sqltag`
        INSERT INTO Version (
          version,
          stage
        ) VALUES (
          ${version},
          'prod'
        );
      `
      await database.query(query)
    }
  }

  static async setMigrated(
    version: string,
    runtime: string,
    migrationScript: string,
  ): Promise<void> {
    const query = sqltag`
      UPDATE Version SET
      isMigrated = TRUE,
      migrationScript = ${migrationScript}
      WHERE version = ${version}
      AND stage = ${runtime};
    `
    await database.query(query)
  }
}
