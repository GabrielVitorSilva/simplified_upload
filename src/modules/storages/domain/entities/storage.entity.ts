export class StorageEntity {
  id: string;
  name: string;
  bucket: string;
  region: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StorageEntity>) {
    Object.assign(this, partial);
  }
}
