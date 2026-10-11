import { loadConfig } from './env.js'

// Loaded once at startup. Tests set their own environment before importing the app.
export const config = loadConfig()
