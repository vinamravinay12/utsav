import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { logEvent } from './logging/log.js';
import { createGeminiClientFromKey } from './llm/gemini-client.js';
import { createOfflineClient } from './llm/offline-client.js';

const config = loadConfig(process.env);
const llm =
  config.geminiApiKey === null
    ? createOfflineClient()
    : createGeminiClientFromKey(config.geminiApiKey, config.models);
const mode = config.geminiApiKey === null ? 'offline' : 'gemini';

if (mode === 'offline') {
  logEvent('WARNING', 'No GEMINI_API_KEY set: running with the offline keyword reader.');
}

/** The listening HTTP server, kept so it can close cleanly on shutdown. */
const server = createApp({ llm, config, mode }).listen(config.port, () => {
  logEvent('INFO', 'Utsav listening', { port: config.port, mode, models: config.models });
});

// Cloud Run sends SIGTERM before stopping an instance; finish in-flight requests first.
process.on('SIGTERM', () => {
  server.close();
});
