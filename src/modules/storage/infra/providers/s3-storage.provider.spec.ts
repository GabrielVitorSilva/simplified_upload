import { Test, TestingModule } from "@nestjs/testing";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3StorageProvider } from "./s3-storage.provider";
import { S3_CLIENT } from "../../../../shared/aws/s3-client.provider";

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

const mockSend = jest.fn();

const mockS3Client = {
  send: mockSend,
};

describe("S3StorageProvider", () => {
  let provider: S3StorageProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3StorageProvider,
        { provide: S3_CLIENT, useValue: mockS3Client },
      ],
    }).compile();

    provider = module.get<S3StorageProvider>(S3StorageProvider);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });

  describe("generateUploadUrl", () => {
    it("should return a presigned upload URL", async () => {
      const mockSignedUrl =
        "https://s3.amazonaws.com/my-bucket/key?X-Amz-Signature=abc";
      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      const result = await provider.generateUploadUrl({
        bucket: "my-bucket",
        key: "uploads/file.png",
        mimeType: "image/png",
        expiresIn: 300,
      });

      expect(result.uploadUrl).toBe(mockSignedUrl);
      expect(result.key).toBe("uploads/file.png");
      expect(result.expiresIn).toBe(300);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe("generateDownloadUrl", () => {
    it("should return a presigned download URL", async () => {
      const mockSignedUrl =
        "https://s3.amazonaws.com/my-bucket/key?X-Amz-Signature=xyz";
      (getSignedUrl as jest.Mock).mockResolvedValue(mockSignedUrl);

      const result = await provider.generateDownloadUrl({
        bucket: "my-bucket",
        key: "uploads/file.png",
        expiresIn: 3600,
      });

      expect(result.url).toBe(mockSignedUrl);
      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe("uploadObject", () => {
    it("should call S3 PutObjectCommand with file body", async () => {
      mockSend.mockResolvedValue({});

      await provider.uploadObject({
        bucket: "my-bucket",
        key: "uploads/file.png",
        body: Buffer.from("file"),
        mimeType: "image/png",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should propagate S3 upload errors", async () => {
      mockSend.mockRejectedValue(new Error("S3 upload error"));

      await expect(
        provider.uploadObject({
          bucket: "my-bucket",
          key: "uploads/file.png",
          body: Buffer.from("file"),
          mimeType: "image/png",
        }),
      ).rejects.toThrow("S3 upload error");
    });
  });

  describe("deleteObject", () => {
    it("should call S3 DeleteObjectCommand", async () => {
      mockSend.mockResolvedValue({});

      await provider.deleteObject({
        bucket: "my-bucket",
        key: "uploads/file.png",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should propagate S3 errors", async () => {
      mockSend.mockRejectedValue(new Error("S3 error"));

      await expect(
        provider.deleteObject({ bucket: "my-bucket", key: "key" }),
      ).rejects.toThrow("S3 error");
    });
  });
});
