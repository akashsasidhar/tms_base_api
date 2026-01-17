import { EncryptJWT, jwtDecrypt } from 'jose';
import { jwtConfig } from '../config/jwt';
import crypto from 'crypto';

/**
 * Ensure JWE secret key is exactly 32 bytes (256 bits) for A256GCM encryption
 * Hash the key to a fixed 32-byte length if it's longer
 */
function getJweSecretKey(): Uint8Array {
  const keyString = jwtConfig.jweSecretKey;
  const encoded = new TextEncoder().encode(keyString);
  
  // If key is exactly 32 bytes, use it directly
  if (encoded.length === 32) {
    return encoded;
  }
  
  // If key is longer, hash it to 32 bytes
  if (encoded.length > 32) {
    return new Uint8Array(crypto.createHash('sha256').update(keyString).digest());
  }
  
  // If key is shorter, pad it with repeated hash
  const hash = crypto.createHash('sha256').update(keyString).digest();
  return new Uint8Array(hash);
}

// Secret key is used in encryption/decryption functions below
const jweSecretKey = getJweSecretKey();

/**
 * Generate access token (JWT encrypted with JWE)
 */
export async function generateAccessToken(
  userId: string,
  username: string,
  roles: string[]
): Promise<string> {
  // Create and encrypt JWT directly with JWE
  const encryptedToken = await new EncryptJWT({
    userId,
    username,
    roles,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(jwtConfig.accessTokenExpiry)
    .setIssuer('task-management-system')
    .setAudience('task-management-api')
    .encrypt(jweSecretKey);

  return encryptedToken;
}

/**
 * Generate refresh token (JWT encrypted with JWE)
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  // Create and encrypt JWT directly with JWE
  const encryptedToken = await new EncryptJWT({
    userId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(jwtConfig.refreshTokenExpiry)
    .setIssuer('task-management-system')
    .setAudience('task-management-api')
    .encrypt(jweSecretKey);

  return encryptedToken;
}

/**
 * Verify and decrypt access token
 */
export async function verifyAccessToken(token: string): Promise<{
  userId: string;
  username: string;
  roles: string[];
  type: string;
}> {
  try {
    // Decrypt and verify JWE token
    const { payload } = await jwtDecrypt(token, jweSecretKey, {
      issuer: 'task-management-system',
      audience: 'task-management-api',
    });

    if (payload['type'] !== 'access') {
      throw new Error('Invalid token type');
    }

    return {
      userId: payload['userId'] as string,
      username: payload['username'] as string,
      roles: payload['roles'] as string[],
      type: payload['type'] as string,
    };
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify and decrypt refresh token
 */
export async function verifyRefreshToken(token: string): Promise<{
  userId: string;
  type: string;
}> {
  try {
    // Decrypt and verify JWE token
    const { payload } = await jwtDecrypt(token, jweSecretKey, {
      issuer: 'task-management-system',
      audience: 'task-management-api',
    });

    if (payload['type'] !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return {
      userId: payload['userId'] as string,
      type: payload['type'] as string,
    };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Hash refresh token for storage in database
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Compare refresh token with hash
 */
export function compareRefreshToken(token: string, hash: string): boolean {
  const tokenHash = hashRefreshToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  );
}
