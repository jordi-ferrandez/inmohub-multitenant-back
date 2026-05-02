export interface WordPressImportResultDTO {
  propertiesProcessed: number;
  propertiesImported: number;
  propertiesUpdated: number;
  buildingsCreated: number;
  peopleImported: number;
  followUpsCreated: number;
  followUpsSkipped: number;
  errors: string[];
}
