import { Request as ExpressRequest } from "express";

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: string;
    email: string;
  };
}
