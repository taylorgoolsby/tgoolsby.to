export default `CREATE TABLE IF NOT EXISTS \`Player\` (
  \`username\` VARCHAR(25) NOT NULL,
  \`status\` VARCHAR(50) NOT NULL,
  \`color\` VARCHAR(7) NOT NULL,
  \`secret\` VARCHAR(50) NOT NULL,
  \`position\` TEXT NOT NULL,
  \`lookDirection\` TEXT NOT NULL,
  \`statusMetadata\` TEXT NOT NULL DEFAULT '{}',
  \`memoryMetadata\` TEXT NOT NULL DEFAULT '{}',
  \`initialSetupConversation\` TEXT NOT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`username\`)
);

CREATE TABLE IF NOT EXISTS \`Description\` (
  \`descriptionId\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`positionX\` INTEGER NOT NULL,
  \`positionY\` INTEGER NOT NULL,
  \`positionZ\` INTEGER NOT NULL,
  \`lookDirectionAngle\` INTEGER NOT NULL,
  \`lookDirectionAzimuth\` INTEGER NOT NULL,
  \`description\` TEXT NOT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS \`POSITIONXINDEX\` ON \`Description\` (\`positionX\` ASC);
CREATE INDEX IF NOT EXISTS \`POSITIONYINDEX\` ON \`Description\` (\`positionY\` ASC);
CREATE INDEX IF NOT EXISTS \`POSITIONZINDEX\` ON \`Description\` (\`positionZ\` ASC);

CREATE TABLE IF NOT EXISTS \`Error\` (
  \`errorId\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`message\` TEXT NOT NULL,
  \`aiMessage\` TEXT NULL,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`Message\` (
  \`messageId\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`username\` VARCHAR(25) NOT NULL,
  \`role\` VARCHAR(50) NOT NULL,
  \`content\` TEXT NOT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS \`USERNAMEINDEX\` ON \`Message\` (\`username\` ASC);

CREATE TABLE IF NOT EXISTS \`Version\` (
  \`version\` VARCHAR(10) NOT NULL,
  \`stage\` VARCHAR(30) NOT NULL,
  \`isMigrated\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`migrationScript\` TEXT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`
