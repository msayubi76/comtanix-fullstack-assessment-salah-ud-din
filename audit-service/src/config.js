require('dotenv').config({ quiet: true });

const required = ['MONGO_URI', 'AUDIT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI,
  auditSecret: process.env.AUDIT_SECRET,
};
