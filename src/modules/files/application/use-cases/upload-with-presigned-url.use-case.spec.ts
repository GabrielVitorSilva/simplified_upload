import { BadGatewayException, Logger } from "@nestjs/common";
import { UploadWithPresignedUrlUseCase } from "./upload-with-presigned-url.use-case";
import { GenerateUploadUrlUseCase } from "./generate-upload-url.use-case";

describe("UploadWithPresignedUrlUseCase", () => {
  let useCase: UploadWithPresignedUrlUseCase;
  let generateUploadUrlUseCase: jest.Mocked<GenerateUploadUrlUseCase>;
  let fileRepository: { updateStatus: jest.Mock };
  let loggerErrorSpy: jest.SpyInstance;
  const originalFetch = global.fetch;

  beforeEach(() => {
    loggerErrorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
    generateUploadUrlUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GenerateUploadUrlUseCase>;
    fileRepository = {
      updateStatus: jest.fn(),
    };
    useCase = new UploadWithPresignedUrlUseCase(
      generateUploadUrlUseCase,
      fileRepository as any,
    );
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    loggerErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  it("generates a presigned URL and uploads the file through it", async () => {
    generateUploadUrlUseCase.execute.mockResolvedValue({
      fileId: "file-id",
      key: "avatars/generated.png",
      uploadUrl: "https://s3.example/upload",
      expiresIn: 300,
    });
    fileRepository.updateStatus.mockResolvedValue({
      id: "file-id",
      key: "avatars/generated.png",
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    const result = await useCase.execute({
      storageName: "default",
      folder: "avatars",
      fileName: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("image"),
      size: 5,
      clientId: "client-id",
    });

    expect(result).toEqual({
      fileId: "file-id",
      key: "avatars/generated.png",
      uploadUrl: "https://s3.example/upload",
      expiresIn: 300,
      uploaded: true,
    });
    expect(global.fetch).toHaveBeenCalledWith("https://s3.example/upload", {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
      },
      body: expect.any(Blob),
    });
    expect(fileRepository.updateStatus).toHaveBeenCalledWith(
      "file-id",
      "UPLOADED",
    );
    expect(generateUploadUrlUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        size: 5,
      }),
    );
  });

  it("throws BadGatewayException when the presigned upload returns a non-2xx response", async () => {
    generateUploadUrlUseCase.execute.mockResolvedValue({
      fileId: "file-id",
      key: "avatars/generated.png",
      uploadUrl: "https://s3.example/upload",
      expiresIn: 300,
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });

    await expect(
      useCase.execute({
        storageName: "default",
        fileName: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from("image"),
        size: 5,
        clientId: "client-id",
      }),
    ).rejects.toThrow(BadGatewayException);
  });
});
