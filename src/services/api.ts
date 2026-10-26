import { type Sala, type AppConfig } from '../types';

// --------------------------------------------------------------
// 🔀 Ya NO llamamos a Apps Script directo desde el navegador.
// Llamamos a nuestro propio endpoint (/api/gsheets), que corre en
// los servidores de Vercel y es quien de verdad habla con Apps Script.
//
// Por qué: en la red de la biblioteca, Sophos Intercept X inspeccionaba
// el tráfico HTTPS hacia script.google.com / googleusercontent.com y
// agregaba 10-30s de demora intermitente. El navegador ya no toca esos
// dominios en absoluto — solo habla con reserva-de-ambiente.vercel.app,
// que siempre carga rápido. La llamada lenta a Apps Script ahora ocurre
// servidor-a-servidor (Vercel → Google), fuera del alcance de Sophos.
//
// Además: el INTERNAL_KEY ya no viaja en el bundle del navegador (antes
// visible con solo abrir DevTools); ahora vive únicamente como variable
// de entorno del lado del servidor, en /api/gsheets.js.
// --------------------------------------------------------------
const API_URL = '/api/gsheets';

const getFingerprint = () => navigator.userAgent;

let token: string | null = null;

let lastLoginErrorReason: string | null = null;

const FETCH_TIMEOUT_MS = 12_000;
const FETCH_TIMEOUT_GET_SALAS_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonSafe(res: Response, contextLabel: string): Promise<{ data: any | null; rawText: string; parseError: boolean }> {
  const rawText = await res.text();
  try {
    const data = JSON.parse(rawText);
    return { data, rawText, parseError: false };
  } catch {
    console.error(
      `[api] ${contextLabel}: respuesta no-JSON (status ${res.status}).`,
      rawText.slice(0, 300)
    );
    return { data: null, rawText, parseError: true };
  }
}

async function fetchJsonWithRetry(
  url: string,
  options: RequestInit,
  contextLabel: string,
  maxRetries = MAX_RETRIES,
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; data: any | null }> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);
      const { data, parseError } = await parseJsonSafe(res, contextLabel);

      if (parseError) {
        lastError = new Error('non_json_response');
        if (attempt < maxRetries) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
          continue;
        }
        return { ok: false, status: res.status, data: null };
      }

      return { ok: true, status: res.status, data };
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
    }
  }

  console.error(`[api] ${contextLabel}: fallaron todos los intentos.`, lastError);
  return { ok: false, status: 0, data: null };
}

export const apiService = {
  login: async (username: string, password: string): Promise<boolean> => {
    lastLoginErrorReason = null;

    const { ok, data } = await fetchJsonWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: "LOGIN", username, password, fingerprint: getFingerprint() })
      },
      'LOGIN'
    );

    if (!ok || !data) {
      lastLoginErrorReason = 'server_unreachable';
      return false;
    }

    if (data.token) {
      token = data.token;
      return true;
    }

    lastLoginErrorReason = data.error ?? 'unknown_error';
    return false;
  },

  getLastLoginErrorReason: (): string | null => lastLoginErrorReason,

  getSalasYConfig: async (): Promise<{ salas: Sala[]; config: AppConfig }> => {
    const fallback = { salas: [], config: { carreras: [], tipos: [], programasPorSala: {} } };

    const { ok, data } = await fetchJsonWithRetry(
      API_URL,
      { method: 'GET' },
      'GET_SALAS',
      MAX_RETRIES,
      FETCH_TIMEOUT_GET_SALAS_MS
    );

    if (!ok || !data) return fallback;

    return { salas: data.salas ?? [], config: data.config ?? fallback.config };
  },

  securePost: async (data: any): Promise<boolean> => {
    if (!token) return false;

    const { ok, data: json } = await fetchJsonWithRetry(
      API_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...data, token, fingerprint: getFingerprint() })
      },
      `SECURE_POST(${data?.action ?? 'unknown'})`
    );

    if (!ok || !json) return false;
    if (json.token) token = json.token;
    return !json.error;
  }
};