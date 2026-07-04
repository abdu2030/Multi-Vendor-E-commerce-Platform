import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";

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
    const rootFolder =
      this.config.get<string>("CLOUDINARY_UPLOAD_FOLDER")?.trim() ||
      "multi-vendor-ecommerce";
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const uploadFolder = [rootFolder, sanitizeFolder(folder)].filter(Boolean).join("/");
    const signature = this.sign({ folder: uploadFolder, timestamp }, apiSecret);
    const body = new FormData();

    body.append("file", file.trim());
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

