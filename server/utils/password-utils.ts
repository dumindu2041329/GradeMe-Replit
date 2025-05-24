import bcrypt from 'bcrypt';

/**
 * Hash a password using bcrypt
 * @param password Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash or plain text (for backward compatibility)
 * @param plainPassword The plain text password to verify
 * @param hashedOrPlainPassword The stored password (hashed or plain)
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(plainPassword: string, hashedOrPlainPassword: string): Promise<boolean> {
  // Check if the stored password is already hashed (starts with $2b$)
  if (hashedOrPlainPassword.startsWith('$2b$')) {
    return bcrypt.compare(plainPassword, hashedOrPlainPassword);
  } else {
    // For compatibility with existing unhashed passwords
    return plainPassword === hashedOrPlainPassword;
  }
}