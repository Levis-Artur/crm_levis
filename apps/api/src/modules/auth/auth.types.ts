export interface JwtTokenPayload {
  sub: string;
  role: string;
  type: 'access' | 'refresh';
}
