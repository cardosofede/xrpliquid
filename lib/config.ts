// Environment configuration centralized in one place
// All environment-specific constants should be defined here

// For debugging - log actual env vars
console.log("Env vars check:", {
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV,
  DOCKER_ENV: process.env.DOCKER_ENV
});

// Determine if we're running in Docker or locally
const isDocker = process.env.DOCKER_ENV === 'true';

// MongoDB configuration
export const MONGODB = {
  // Use only MONGO_URI for consistency
  URI: process.env.MONGO_URI || 'mongodb://xrpl:xrpl@localhost:27017/',
  // Primary DB name (from env or default)
  DB_NAME: process.env.MONGO_DB_NAME || 'xrpl_transactions',
  // Fallback database names to try (in order)
  FALLBACK_DB_NAMES: ['xrpl', 'xrpl_data', 'xrpliquid'],
  DEFAULT_LIMIT: 1000
}

// API configuration
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  REVALIDATION_TIME: 3600 // 1 hour in seconds
}

// Default values
export const DEFAULTS = {
  DATE_FORMAT_OPTIONS: { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  } as Intl.DateTimeFormatOptions
} 