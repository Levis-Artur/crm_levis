function requireEnv(name: 'API_BASE_URL' | 'NEXT_PUBLIC_API_URL') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getApiBaseUrl() {
  return process.env.API_BASE_URL ?? requireEnv('NEXT_PUBLIC_API_URL');
}
