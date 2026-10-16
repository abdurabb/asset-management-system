// lib/backend/handlers/jwt.ts

import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import crypto from "crypto";

export const generateToken = (id: string, time: string = "1h"): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  const token = jwt.sign({ id }, secret, { expiresIn: time } as SignOptions);
  return encrypt(token);
};

export const verifyToken = (token: string): string | JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");

  return jwt.verify(decrypt(token), secret);
};

export const encrypt = (text: string): string => {
  const secretKey = process.env.SECRET_KEY;
  const iv = process.env.IV;
  if (!secretKey || !iv) throw new Error("SECRET_KEY or IV is not defined");


  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex"),
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

export const decrypt = (text: string): string => {
  const secretKey = process.env.SECRET_KEY;
  const iv = process.env.IV;
  if (!secretKey || !iv) throw new Error("SECRET_KEY or IV is not defined");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex"),
  );

  let decrypted = decipher.update(text, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};
