import { promises as fs } from "fs";
import path from "path";

export type StoredFile = {
  fileName: string;
  filePath: string;
  size: number;
  mimeType?: string;
};

export interface StorageService {
  saveFile: (buffer: Buffer, fileName: string, mimeType?: string) => Promise<StoredFile>;
}

class LocalDiskStorage implements StorageService {
  private uploadDir = path.join(process.cwd(), "public", "uploads");

  async saveFile(buffer: Buffer, fileName: string, mimeType?: string): Promise<StoredFile> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(this.uploadDir, safeName);
    await fs.writeFile(filePath, buffer);
    return {
      fileName: safeName,
      filePath: `/uploads/${safeName}`,
      size: buffer.length,
      mimeType,
    };
  }
}

export const storageService: StorageService = new LocalDiskStorage();
