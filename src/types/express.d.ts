import { IAuth } from "../apis/Auth/auth_types";

declare global {
  namespace Express {
    interface Request {
      user?: IAuth;
    }
  }
}
