export class ClientEntity {
  id: string;
  name: string;
  apiKey: string;
  active: boolean;
  isAdmin: boolean;
  createdAt: Date;

  constructor(partial: Partial<ClientEntity>) {
    Object.assign(this, partial);
  }
}
