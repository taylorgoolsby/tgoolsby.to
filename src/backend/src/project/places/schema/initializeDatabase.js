// /path/to/your/file/initializeDatabase.js

import { setDB, query } from './database.js';
import createTables from './createTables.js';
import VersionInterface from './Version/VersionInterface.js';
import PlayerInterface from './Player/PlayerInterface.js';
import sqltag from 'common/sql-template-tag';
import initSqlJs from 'sql.js';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const databaseName = 'places.db'; // Ensure this path is writable by your EC2 instance
const RESET_DATABASE = false;

export async function initializeDatabase() {
  try {
    if (typeof window !== 'undefined') {
      // Browser environment
      const SQL = await initSqlJs();
      const instance = new SQL.Database();
      setDB(instance);

      if (RESET_DATABASE) {
        console.log('Deleting database.');
        instance.close();
        const newInstance = new SQL.Database();
        setDB(newInstance);
      }

      console.log('Database opened successfully in browser.');
    } else {
      // Node.js environment
      const instance = await open({
        filename: databaseName,
        driver: sqlite3.Database
      });
      setDB(instance);

      if (RESET_DATABASE) {
        console.log('Deleting database.');
        await query({ sql: 'DROP TABLE IF EXISTS Player;', values: [] });
        console.log('Database reset.');
      }

      console.log('Database opened successfully in Node.js.');
    }

    const createTableStatements = createTables
      .split(';')
      .filter(a => !!a)
      .map(statement => statement.trim());

    for (const statement of createTableStatements) {
      await query({ sql: statement, values: [] });
    }
    console.log('Tables created successfully.');

    await migrate();

    await initData();

    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

async function initData() {
  // Initialize data if necessary
}

async function migrate() {
  await VersionInterface.insertCurrentVersion();
  const version = await VersionInterface.getCurrent();
  // console.log('version', version);
}

export async function truncateDatabase() {
  await PlayerInterface.truncateTable();
  await query(sqltag`DELETE FROM sqlite_sequence;`);

  await initData();
}
