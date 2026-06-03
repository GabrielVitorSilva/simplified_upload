export class FileEntity {
  id: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number | null;
  storageId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<FileEntity>) {
    Object.assign(this, partial);
  }
}
