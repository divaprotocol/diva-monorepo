import { readFileSync } from "fs"
import { createHash } from "crypto";

export const fileHash = (path) => {
  const file = readFileSync(path);
  const hash = createHash('sha256')
  hash.update(file)
  return hash.digest("hex");
}