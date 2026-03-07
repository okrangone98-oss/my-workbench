import type {
  FileStorageGateway,
  UploadFileInput,
  UploadResult,
} from "./types.js";

export class FirebaseStorageGateway implements FileStorageGateway {
  public async uploadFile(input: UploadFileInput): Promise<UploadResult> {
    const safeName = input.originalName.replace(/[^\w.-]/g, "_");
    return {
      fileName: `${Date.now()}_${safeName}`,
      publicUrl: "about:blank",
    };
  }
}
