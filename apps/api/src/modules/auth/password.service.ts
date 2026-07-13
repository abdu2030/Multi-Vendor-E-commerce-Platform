import { Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(nodeScrypt);
const BCRYPT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  async hashPassword(password: string) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async verifyPassword(password: string, storedHash: string) {
    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
      return bcrypt.compare(password, storedHash);
    }

    return this.verifyLegacyScryptPassword(password, storedHash);
  }

  private async verifyLegacyScryptPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split("$");

    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const storedKey = Buffer.from(hash, "base64url");
    const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }
}