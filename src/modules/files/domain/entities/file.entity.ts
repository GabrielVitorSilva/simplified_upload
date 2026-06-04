export class FileEntity {
  id: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number | null;
  status: "PENDING" | "UPLOADED";
  storageId: string;
  clientId: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<FileEntity>) {
    Object.assign(this, partial);
  }
}
