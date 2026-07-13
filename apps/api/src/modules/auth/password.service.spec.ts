import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("hashes passwords with bcrypt and never stores plaintext", async () => {
    const hash = await service.hashPassword("StrongPass123");

    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain("StrongPass123");
    await expect(service.verifyPassword("StrongPass123", hash)).resolves.toBe(true);
    await expect(service.verifyPassword("WrongPass123", hash)).resolves.toBe(false);
  });
});