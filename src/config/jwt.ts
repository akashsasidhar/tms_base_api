import appConfig from './app-config';

export const jwtConfig = {
  secret: appConfig.JWT_SECRET,
  jweSecretKey: appConfig.JWE_SECRET_KEY,
  accessTokenExpiry: appConfig.JWT_ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: appConfig.JWT_REFRESH_TOKEN_EXPIRY,
  cookieOptions: {
    httpOnly: true,
    secure: appConfig.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: parseInt(appConfig.REFRESH_COOKIE_MAX_AGE, 10),
    path: '/',
  },
  accessTokenCookieOptions: {
    httpOnly: true,
    secure: appConfig.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: parseInt(appConfig.ACCESS_COOKIE_MAX_AGE, 10),
    path: '/',
  },
};

// Validate that JWE secret key is at least 32 bytes
if (jwtConfig.jweSecretKey.length < 32) {
  throw new Error('JWE_SECRET_KEY must be at least 32 characters long');
}
