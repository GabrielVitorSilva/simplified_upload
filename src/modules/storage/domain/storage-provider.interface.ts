export interface GenerateUploadUrlParams {
  bucket: string;
  key: string;
  mimeType: string;
  expiresIn: number;
}

export interface GenerateDownloadUrlParams {
  bucket: string;
  key: string;
  expiresIn?: number;
}

export interface DeleteObjectParams {
  bucket: string;
  key: string;
}

export interface UploadUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

export interface DownloadUrlResult {
  url: string;
}

export interface StorageProvider {
  generateUploadUrl(params: GenerateUploadUrlParams): Promise<UploadUrlResult>;
  generateDownloadUrl(
    params: GenerateDownloadUrlParams,
  ): Promise<DownloadUrlResult>;
  deleteObject(params: DeleteObjectParams): Promise<void>;
}

export const STORAGE_PROVIDER = "STORAGE_PROVIDER";
