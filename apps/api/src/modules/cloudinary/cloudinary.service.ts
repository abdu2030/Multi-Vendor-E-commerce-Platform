import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { isIP } from "net";

const allowedDataImagePattern = /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i;
const allowedRemoteImageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const blockedHostnames = new Set(["localhost", "metadata.google.internal"]);

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

export type UploadedImage = {
  publicId: string;
  url: string;
  resourceType: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  async uploadImage(file: string, folder: string): Promise<UploadedImage> {
    const cloudName = this.requiredConfig("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.requiredConfig("CLOUDINARY_API_KEY");
    const apiSecret = this.requiredConfig("CLOUDINARY_API_SECRET");
    const imageSource = normalizeImageSource(file);
    const rootFolder =
      this.config.get<string>("CLOUDINARY_UPLOAD_FOLDER")?.trim() ||
      "multi-vendor-ecommerce";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const uploadFolder = [rootFolder, sanitizeFolder(folder)].filter(Boolean).join("/");
    const signature = this.sign({ folder: uploadFolder, timestamp }, apiSecret);
    const body = new FormData();

    body.append("file", imageSource);
    body.append("api_key", apiKey);
    body.append("timestamp", timestamp);
    body.append("folder", uploadFolder);
    body.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body
      }
    );
    const responseText = await response.text();
    const payload = safeParseJson(responseText);

    if (!response.ok) {
      throw new BadRequestException(
        getCloudinaryErrorMessage(payload) || "Cloudinary upload failed."
      );
    }

    if (!isCloudinaryUploadResponse(payload)) {
      throw new ServiceUnavailableException("Cloudinary returned an invalid upload response.");
    }

    return {
      publicId: payload.public_id,
      url: payload.secure_url,
      resourceType: payload.resource_type,
      format: payload.format,
      bytes: payload.bytes,
      width: payload.width,
      height: payload.height
    };
  }

  private requiredConfig(key: string) {
    const value = this.config.get<string>(key)?.trim();

    if (!value) {
      throw new ServiceUnavailableException(`${key} is required for image uploads.`);
    }

    return value;
  }

  private sign(params: Record<string, string>, apiSecret: string) {
    const signatureBase = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    return createHash("sha1")
      .update(`${signatureBase}${apiSecret}`)
      .digest("hex");
  }
}

function normalizeImageSource(value: string) {
  const source = value.trim();

  if (allowedDataImagePattern.test(source)) {
    return source;
  }

  let url: URL;

  try {
    url = new URL(source);
  } catch {
    throw new BadRequestException("Image upload source must be a valid HTTPS image URL or image data URI.");
  }

  if (url.protocol !== "https:") {
    throw new BadRequestException("Remote image uploads must use HTTPS.");
  }

  if (url.username || url.password) {
    throw new BadRequestException("Remote image URLs must not include credentials.");
  }

  if (isBlockedHostname(url.hostname)) {
    throw new BadRequestException("Remote image host is not allowed.");
  }

  if (hasPathTraversal(source)) {
    throw new BadRequestException("Remote image URL path must not include traversal segments.");
  }

  if (!allowedRemoteImageExtensions.has(getLowercaseExtension(url.pathname))) {
    throw new BadRequestException("Remote image URL must end in png, jpg, jpeg, webp, or gif.");
  }

  return url.toString();
}

function isBlockedHostname(hostname: string) {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  if (blockedHostnames.has(normalized) || normalized.endsWith(".localhost")) {
    return true;
  }

  const ipVersion = isIP(normalized);

  if (ipVersion === 4) {
    return isPrivateIpv4(normalized);
  }

  if (ipVersion === 6) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }

  return false;
}

function isPrivateIpv4(value: string) {
  const octets = value.split(".").map(Number);
  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function hasPathTraversal(value: string) {
  const normalized = value.toLowerCase();

  return (
    /(?:^|[/?#&])\.\.(?:[/?#&]|$)/.test(normalized) ||
    normalized.includes("..\\") ||
    normalized.includes("%2e%2e") ||
    normalized.includes("%2f..") ||
    normalized.includes("%5c..") ||
    normalized.includes("..%2f") ||
    normalized.includes("..%5c")
  );
}

function getLowercaseExtension(pathname: string) {
  const lastSegment = pathname.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");

  return dotIndex >= 0 ? lastSegment.slice(dotIndex).toLowerCase() : "";
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getCloudinaryErrorMessage(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as { error?: { message?: unknown } };

  return typeof payload.error?.message === "string"
    ? payload.error.message
    : null;
}
function isCloudinaryUploadResponse(value: unknown): value is CloudinaryUploadResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CloudinaryUploadResponse>;

  return Boolean(payload.public_id && payload.secure_url && payload.resource_type);
}

function sanitizeFolder(value: string) {
  return value
    .split("/")
    .map((part) =>
      part
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter(Boolean)
    .join("/");
}
