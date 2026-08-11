import { IUser } from '../models/User.model';
import { ITherapistGrant } from '../models/TherapistGrant.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      pactId?: string;
      sessionId?: string;
      therapistGrant?: ITherapistGrant;
      cloudinaryUrl?: string;
      cloudinaryPublicId?: string;
    }
  }
}

export {};
