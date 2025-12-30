import crypto from 'crypto';

/**
 * Generate a verification token and expiration date
 * @returns {Object} Object containing token and expiration date
 */
export const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token expires in 24 hours

  return {
    token,
    expires
  };
};
