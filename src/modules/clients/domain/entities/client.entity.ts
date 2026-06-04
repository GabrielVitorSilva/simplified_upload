export class ClientEntity {
  id: string;
  name: string;
  apiKey?: string;
  apiKeyHash?: string;
  active: boolean;
  isAdmin: boolean;
  createdAt: Date;

  constructor(partial: Partial<ClientEntity>) {
    Object.assign(this, partial);
  }
}
