import { readFileSync } from "fs";
import { resolve } from "path";

const repoRoot = resolve(process.cwd(), "../..");

describe("final deployment hardening", () => {
  it("runs database migrations before the Render API build starts", () => {
    const renderYaml = readRepoFile("render.yaml");

    expect(renderYaml).toContain("buildCommand: npm ci --include=dev && npm run prisma:deploy -w apps/api && npm run build -w apps/api");
    expect(renderYaml).toContain("healthCheckPath: /api/health");
  });

  it("keeps production secrets out of the Render blueprint", () => {
    const renderYaml = readRepoFile("render.yaml");

    for (const key of [
      "FRONTEND_URL",
      "CORS_ORIGIN",
      "DATABASE_URL",
      "REDIS_URL",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "GMAIL_USER",
      "GMAIL_APP_PASSWORD",
      "ADMIN_NAME",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD"
    ]) {
      expect(renderYaml).toMatch(new RegExp(`- key: ${key}\\r?\\n\\s+sync: false`));
    }

    expect(renderYaml).toContain('value: "false"');
    expect(renderYaml).not.toMatch(/sk_(live|test)_[A-Za-z0-9]/);
    expect(renderYaml).not.toMatch(/postgres(?:ql)?:\/\/[^\s]+:[^\s]+@/);
    expect(renderYaml).not.toMatch(/rediss?:\/\/[^\s]+:[^\s]+@/);
  });

  it("requires production transport security in the production env example", () => {
    const apiEnv = readRepoFile("apps/api/.env.production.example");
    const webEnv = readRepoFile("apps/web/.env.production.example");

    expect(apiEnv).toContain("FRONTEND_URL=https://example.com");
    expect(apiEnv).toContain("CORS_ORIGIN=https://example.com");
    expect(apiEnv).toContain("DATABASE_URL=replace_with_postgresql_connection_string_with_sslmode_require");
    expect(apiEnv).toContain("REDIS_URL=replace_with_rediss_connection_string");
    expect(apiEnv).toContain("REDIS_TLS=true");
    expect(apiEnv).toContain("ALLOW_TEST_STRIPE_KEYS=false");
    expect(webEnv).toMatch(/^NEXT_PUBLIC_API_URL=https:\/\/.+\/api$/m);
  });

  it("does not expose Swagger or OpenAPI documentation packages in production code", () => {
    const packageJson = JSON.parse(readRepoFile("apps/api/package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const main = readRepoFile("apps/api/src/main.ts");

    expect(packageJson.dependencies?.["@nestjs/swagger"]).toBeUndefined();
    expect(packageJson.devDependencies?.["@nestjs/swagger"]).toBeUndefined();
    expect(main).not.toMatch(/SwaggerModule|DocumentBuilder|setup\(["']docs/);
  });
});

function readRepoFile(path: string) {
  return readFileSync(resolve(repoRoot, path), "utf8");
}