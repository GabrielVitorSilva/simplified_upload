import { ConflictException, NotFoundException } from "@nestjs/common";
import { DeleteClientUseCase } from "./delete-client.use-case";
import { ClientRepository } from "../../domain/repositories/client.repository.interface";
import { ClientEntity } from "../../domain/entities/client.entity";

const mockClient = (overrides: Partial<ClientEntity> = {}) =>
  new ClientEntity({
    id: "client-id",
    name: "Client",
    active: true,
    isAdmin: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  });

describe("DeleteClientUseCase", () => {
  let useCase: DeleteClientUseCase;
  let clientRepository: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    clientRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      countActiveAdmins: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new DeleteClientUseCase(clientRepository);
  });

  it("deletes a normal client", async () => {
    clientRepository.findById.mockResolvedValue(mockClient());

    await useCase.execute("client-id");

    expect(clientRepository.delete).toHaveBeenCalledWith("client-id");
    expect(clientRepository.countActiveAdmins).not.toHaveBeenCalled();
  });

  it("throws NotFoundException when client does not exist", async () => {
    clientRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing-id")).rejects.toThrow(
      NotFoundException,
    );
    expect(clientRepository.delete).not.toHaveBeenCalled();
  });

  it("blocks deleting the last active admin", async () => {
    clientRepository.findById.mockResolvedValue(mockClient({ isAdmin: true }));
    clientRepository.countActiveAdmins.mockResolvedValue(1);

    await expect(useCase.execute("client-id")).rejects.toThrow(
      ConflictException,
    );
    expect(clientRepository.delete).not.toHaveBeenCalled();
  });

  it("deletes an admin when another active admin exists", async () => {
    clientRepository.findById.mockResolvedValue(mockClient({ isAdmin: true }));
    clientRepository.countActiveAdmins.mockResolvedValue(2);

    await useCase.execute("client-id");

    expect(clientRepository.delete).toHaveBeenCalledWith("client-id");
  });
});
