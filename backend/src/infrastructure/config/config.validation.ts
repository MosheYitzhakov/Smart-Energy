import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),

  JWT_SECRET: Joi.string().min(32).required(),

  AI_MOCK: Joi.boolean().default(true),
  OLLAMA_URL: Joi.string().uri().default('http://ollama:11434'),
  OLLAMA_MODEL: Joi.string().default('llama3.1:8b'),
});
