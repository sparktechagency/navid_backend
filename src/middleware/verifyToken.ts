import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import config, { HttpStatus } from "../DefaultConfig/config";
import auth_model from "../apis/Auth/auth_model";

interface DecodedToken extends JwtPayload {
  id?: string;
}

// Modify verifyToken to accept an array of allowed roles
const verifyToken = (
  allowedRoles: string[] = [],
  privet: boolean = true,
  type: string = config.TOKEN_NAME,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      let tokenWithBearer = req.headers.authorization || req.cookies[type];

      if (!tokenWithBearer && !privet) {
        return next();
      }

      if (!tokenWithBearer) {
        res.status(403).send({ success: false, message: "Forbidden access" });
        return;
      }

      let token: string;
      if (tokenWithBearer.startsWith("Bearer ")) {
        token = tokenWithBearer.split(" ")[1];
      } else {
        token = tokenWithBearer;
      }
      
      jwt.verify(
        token,
        config.ACCESS_TOKEN_SECRET || "",
        async (err, decoded) => {
          console.log("-------",err)
          if (err) {
            res
              .status(401)
              .send({ success: false, message: "Unauthorized access" });
            return;
          }

          const decodedToken = decoded as DecodedToken;

          if (type == config.ACCESS_TOKEN_NAME) {
            const user = await auth_model.findOne({
              email: decodedToken?.email,
            });
            // console.log(user)
            if (user && user?.accessToken == token) {
              req.user = user;
              return next();
            } else {
              return res.status(HttpStatus.NOT_FOUND).send({
                success: false,
                message: "token missing or token has been expired",
              });
            }
          }

          const user = await auth_model.findById(decodedToken.id);

          if (!user) {
            if (privet) {
              res
                .status(404)
                .send({ success: false, message: "User not found" });
              return;
            } else {
              return next();
            }
          }

          if (user.block) {
            return res
              .status(401)
              .send({ success: false, message: "You are blocked by admin" });
          }
          if (!user.is_verified) {
            return res.status(401).send({
              success: false,
              message: "You please verify your email",
            });
          }
          if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            res.status(403).send({
              success: false,
              message: "Access denied: insufficient permissions",
            });
            return;
          }
          req.user = user.toObject();
          next();
        },
      );
    } catch (error) {
      next(error); // Forward errors to the error-handling middleware
    }
  };
};

export default verifyToken;
