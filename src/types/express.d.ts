import { AuthenticatedUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
      apiKey?: {
        id: string;
        userId: string;
        scopes: string[];
        name: string;
      };
    }
  }
}

export {};
