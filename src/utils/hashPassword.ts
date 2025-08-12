import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const algorithm = process.env.HASH_ALGORITHM || "sha256"; 
const secretKey = process.env.HASH_SECRET_KEY || "default_secret";

const HashPassword = (data: string): string => {
  return crypto
    .createHmac(algorithm, secretKey)
    .update(data)
    .digest("hex");
};

export default HashPassword;
