import { z } from 'zod';

const optionalEnvString = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().min(1).optional());

const envBoolean = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off', ''].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_EXPIRES_IN: z.string().min(2).default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(2).default('30d'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    AI_CHAT_ENABLED: envBoolean.default(false),
    OPENAI_API_KEY: optionalEnvString,
    OPENAI_MODEL: z.string().min(1).default('gpt-5-mini'),
    OPENAI_API_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
    OPENAI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    NOVA_POSHTA_ENABLED: envBoolean.default(false),
    NOVA_POSHTA_BASE_URL: z
      .string()
      .url()
      .default('https://api.novaposhta.ua/v2.0/json/'),
    NOVA_POSHTA_API_URL: z.string().url().optional(),
    NOVA_POSHTA_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
    NOVA_POSHTA_API_KEY: optionalEnvString,
    NOVA_POSHTA_SENDER_NAME: optionalEnvString,
    NOVA_POSHTA_SENDER_REF: optionalEnvString,
    NOVA_POSHTA_SENDER_CITY_REF: optionalEnvString,
    NOVA_POSHTA_SENDER_WAREHOUSE_REF: optionalEnvString,
    NOVA_POSHTA_SENDER_ADDRESS_REF: optionalEnvString,
    NOVA_POSHTA_SENDER_CONTACT_REF: optionalEnvString,
    NOVA_POSHTA_SENDER_PHONE: optionalEnvString,
    NOVA_POSHTA_DEFAULT_SERVICE_TYPE: z.string().min(1).default('WarehouseWarehouse'),
    NOVA_POSHTA_DEFAULT_PAYER_TYPE: z.string().min(1).default('Recipient'),
    NOVA_POSHTA_DEFAULT_PAYMENT_METHOD: z.string().min(1).default('Cash'),
    NOVA_POSHTA_DEFAULT_CARGO_TYPE: z.string().min(1).default('Cargo'),
    NOVA_POSHTA_DEFAULT_WEIGHT: z.coerce.number().positive().default(1),
    NOVA_POSHTA_DEFAULT_SEATS_AMOUNT: z.coerce.number().int().positive().default(1),
  })
  .superRefine((config, context) => {
    if (config.AI_CHAT_ENABLED && !config.OPENAI_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'is required when AI_CHAT_ENABLED=true',
      });
    }

    if (!config.NOVA_POSHTA_ENABLED) {
      return;
    }

    const requiredKeys = [
      'NOVA_POSHTA_API_KEY',
      'NOVA_POSHTA_SENDER_NAME',
      'NOVA_POSHTA_SENDER_REF',
      'NOVA_POSHTA_SENDER_CITY_REF',
      'NOVA_POSHTA_SENDER_CONTACT_REF',
      'NOVA_POSHTA_SENDER_PHONE',
    ] as const;

    for (const key of requiredKeys) {
      if (!config[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'is required when NOVA_POSHTA_ENABLED=true',
        });
      }
    }

    if (!config.NOVA_POSHTA_SENDER_WAREHOUSE_REF && !config.NOVA_POSHTA_SENDER_ADDRESS_REF) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NOVA_POSHTA_SENDER_WAREHOUSE_REF'],
        message:
          'or NOVA_POSHTA_SENDER_ADDRESS_REF is required when NOVA_POSHTA_ENABLED=true',
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    throw new Error(`Invalid environment configuration. ${details}`);
  }

  return parsed.data;
}
