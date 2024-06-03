// @flow

export type VersionSQL = {
  version: string,
  stage: string,
  isMigrated: boolean,
  migrationScript: string,
  dateUpdated: string,
  dateCreated: string,
};
