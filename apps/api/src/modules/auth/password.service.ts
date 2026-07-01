import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hashPassword(password: string) {
    const salt = randomBytes(16).toString("base64url");
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;

    return `scrypt$${salt}$${derivedKey.toString("base64url")}`;
  }

  async verifyPassword(password: string, storedHash: string) {
    const [algorithm, salt, hash] = storedHash.split("$");

    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const storedKey = Buffer.from(hash, "base64url");
    const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;

    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }
}
