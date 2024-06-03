export default `CREATE TABLE IF NOT EXISTS \`Player\` (
  \`playerId\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`username\` VARCHAR(25) NOT NULL,
  \`status\` VARCHAR(50) NOT NULL,
  \`color\` VARCHAR(7) NOT NULL,
  \`secret\` VARCHAR(50) NOT NULL,
  \`position\` TEXT NOT NULL,
  \`look_direction\` TEXT NOT NULL,
  \`statusMetadata\` TEXT NOT NULL DEFAULT '{}',
  \`memoryMetadata\` TEXT NOT NULL DEFAULT '{}',
  \`initialSetupConversation\` TEXT NOT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`Description\` (
  \`descriptionId\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`position\` TEXT NOT NULL,
  \`look_direction\` TEXT NOT NULL,
  \`description\` TEXT NOT NULL,
  \`embedding\` TEXT NOT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`Error\` (
  \`errorId\` INTEGER PRIMARY KEY AUTOINCREMENT,
  \`message\` TEXT NOT NULL,
  \`ai_generated_message\` TEXT NULL,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`Version\` (
  \`version\` VARCHAR(10) NOT NULL,
  \`stage\` VARCHAR(30) NOT NULL,
  \`isMigrated\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`migrationScript\` TEXT NULL,
  \`dateUpdated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`dateCreated\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);`