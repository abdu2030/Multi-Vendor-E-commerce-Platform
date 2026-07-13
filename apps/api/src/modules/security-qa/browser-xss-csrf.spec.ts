import { ValidationPipe } from "@nestjs/common";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { createValidationException } from "../../common/validation/validation-errors";
import { renderSellerDecisionEmail } from "../mail/email-templates";
import { CreateReviewDto } from "../reviews/dto/create-review.dto";
import { CreateSellerApplicationDto } from "../seller-applications/dto/create-seller-application.dto";
import { UpdateStoreSettingsDto } from "../seller-dashboard/dto/update-store-settings.dto";
import { ProductImageInputDto } from "../seller-products/dto/product-image-input.dto";

describe("Browser XSS and CSRF security", () => {
  it("escapes script tags in generated HTML email content", () => {
    const email = renderSellerDecisionEmail({
      recipientName: "Seller",
      storeName: '<script>alert("xss")</script>',
      decision: "approved",
      reason: '<img src=x onerror="alert(1)">',
      sellerDashboardUrl: "https://shop.example.test/dashboard/seller"
    });

    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img");
    expect(email.html).not.toContain('onerror="');
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("does not use direct HTML injection sinks in frontend source", () => {
    const webFiles = getSourceFiles(path.resolve(process.cwd(), "../web/src"));
    const forbiddenSink = /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(/;
    const offenders = webFiles.filter((file) => forbiddenSink.test(readFileSync(file, "utf8")));

    expect(offenders).toEqual([]);
  });

  it("rejects dangerous URL protocols in browser-rendered URL DTOs", async () => {
    const pipe = createSecurityValidationPipe();

    await expect(pipe.transform(
      { logoUrl: "javascript:alert(1)", bannerUrl: "https://cdn.example.test/banner.png" },
      { type: "body", metatype: UpdateStoreSettingsDto }
    )).rejects.toMatchObject({ response: { errors: expect.arrayContaining([expect.objectContaining({ field: "logoUrl" })]) } });
    await expect(pipe.transform(
      { storeName: "Seller", storeDescription: "A reliable seller application.", phone: "1234567", address: "Market street", businessDocument: "ftp://files.example.test/doc.pdf" },
      { type: "body", metatype: CreateSellerApplicationDto }
    )).rejects.toMatchObject({ response: { errors: expect.arrayContaining([expect.objectContaining({ field: "businessDocument" })]) } });
    await expect(pipe.transform(
      { url: "ftp://cdn.example.test/product.png" },
      { type: "body", metatype: ProductImageInputDto }
    )).rejects.toMatchObject({ response: { errors: expect.arrayContaining([expect.objectContaining({ field: "url" })]) } });
    await expect(pipe.transform(
      { rating: 5, comment: "A verified review with images.", images: ["javascript:alert(1)"] },
      { type: "body", metatype: CreateReviewDto }
    )).rejects.toMatchObject({ response: { errors: expect.arrayContaining([expect.objectContaining({ field: "images" })]) } });
  });

  it("does not persist sensitive access or refresh tokens in browser storage", () => {
    const authProvider = readFileSync(
      path.resolve(process.cwd(), "../web/src/components/auth/auth-provider.tsx"),
      "utf8"
    );

    expect(authProvider).not.toMatch(/localStorage\.setItem\([^\n]*(ACCESS|REFRESH)_TOKEN/i);
    expect(authProvider).toContain("localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)");
    expect(authProvider).toContain("localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)");
  });

  it("defines Content Security Policy headers for the API and web app", () => {
    const apiMain = readFileSync(path.resolve(process.cwd(), "src/main.ts"), "utf8");
    const nextConfig = readFileSync(path.resolve(process.cwd(), "../web/next.config.ts"), "utf8");

    expect(apiMain).toContain("contentSecurityPolicy");
    expect(nextConfig).toContain("Content-Security-Policy");
    expect(nextConfig).toContain("object-src 'none'");
    expect(nextConfig).toContain("frame-ancestors 'none'");
  });

  it("does not declare mutating actions as GET routes", () => {
    const controllerFiles = getSourceFiles(path.resolve(process.cwd(), "src/modules"))
      .filter((file) => file.endsWith(".controller.ts"));
    const mutatingGetRoutes = controllerFiles.flatMap((file) => {
      const source = readFileSync(file, "utf8");
      const matches = Array.from(source.matchAll(/@Get\(([^)]*)\)/g));

      return matches
        .map((match) => match[1])
        .filter((route) => /activate|deactivate|approve|reject|suspend|archive|delete|logout|refresh|change|create|update|read-all/i.test(route))
        .map((route) => `${path.basename(file)}:${route}`);
    });

    expect(mutatingGetRoutes).toEqual([]);
  });
});

function createSecurityValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: createValidationException
  });
}

function getSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const absolute = path.join(root, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      return getSourceFiles(absolute);
    }

    return /\.[cm]?[jt]sx?$/.test(entry) ? [absolute] : [];
  });
}
