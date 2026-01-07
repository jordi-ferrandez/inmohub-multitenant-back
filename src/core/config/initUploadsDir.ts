import fs from "fs";
import path from "path";

export function initUploadsDir() {
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
}
