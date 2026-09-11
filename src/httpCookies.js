import { NativeModules, Platform } from 'react-native';
import { parse, splitCookiesString } from 'set-cookie-parser';

let nativeCookieManager;

function hasNativeCookieModule() {
  if (!isReactNative()) return false;
  if (Platform.OS === 'ios') return Boolean(NativeModules.RNCookieManagerIOS);
  if (Platform.OS === 'android') return Boolean(NativeModules.RNCookieManagerAndroid);
  return false;
}

export function resetNativeCookieSession() {
}

export async function clearNativeCookies() {
  const manager = getNativeCookieManager();
  if (!manager?.clearAll) return;
  try {
    await manager.clearAll(true);
  } catch {
  }
}

export function isNetworkFetchError(error) {
  const message = String(error?.message || error || '');
  return /network request failed|failed to connect|unable to resolve host|network error|timeout|timed out|ecconnrefused|econnreset|ssl|handshake|certificate/i.test(
    message
  );
}

export function wrapFetchNetworkError(error, url) {
  if (!isNetworkFetchError(error)) return error;

  let host = String(url || '');
  try {
    host = new URL(url).hostname;
  } catch {
  }

  if (isReactNative()) {
    return new Error(
      `Nie udało się otworzyć ${host} z aplikacji mobilnej. Sprawdź internet i spróbuj ponownie.`
    );
  }

  return new Error(
    `Błąd połączenia z ${host}. Sprawdź internet i spróbuj ponownie.`
  );
}

export function readResponseHeader(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(name.toLowerCase()) || '';
  }
  return headers[name] || headers[name.toLowerCase()] || '';
}

export function readAllSetCookieHeaders(headers) {
  if (!headers) return [];

  if (typeof headers.getSetCookie === 'function') {
    const direct = headers.getSetCookie();
    if (direct?.length) return direct.map((line) => String(line));
  }

  const raw = readResponseHeader(headers, 'set-cookie');
  if (!raw) return [];

  const chunks = Array.isArray(raw) ? raw : [raw];
  const lines = [];
  chunks.forEach((chunk) => {
    if (!chunk) return;
    splitCookiesString(String(chunk)).forEach((line) => lines.push(line));
  });
  return lines;
}

export function cookieHeader(jar) {
  return Array.from(jar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

export function isReactNative() {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
}

function getNativeCookieManager() {
  if (nativeCookieManager !== undefined) return nativeCookieManager;
  if (!hasNativeCookieModule()) {
    nativeCookieManager = null;
    return null;
  }
  try {
    nativeCookieManager = require('@react-native-cookies/cookies');
  } catch {
    nativeCookieManager = null;
  }
  return nativeCookieManager;
}

export function usesNativeCookieStore() {
  return Boolean(getNativeCookieManager());
}

export async function pushJarToNativeCookies(url, jar) {
  const manager = getNativeCookieManager();
  if (!manager || !jar?.size) return;

  await Promise.all(
    Array.from(jar.entries()).map(([name, value]) =>
      manager.set(url, { name, value, path: '/' }).catch(() => false)
    )
  );
}

export async function syncNativeCookiesForUrls(jar, urls) {
  if (!jar || !usesNativeCookieStore()) return;
  const unique = [...new Set((urls || []).filter(Boolean))];
  for (const url of unique) {
    await pullNativeCookiesToJar(url, jar);
  }
}

export async function pullNativeCookiesToJar(url, jar) {
  const manager = getNativeCookieManager();
  if (!manager) return;

  try {
    const cookies = await manager.get(url);
    Object.values(cookies || {}).forEach((cookie) => {
      if (cookie?.name) jar.set(cookie.name, cookie.value);
    });
  } catch {
  }
}

function saveSetCookieLinesToJar(jar, cookieLines) {
  if (!jar || !cookieLines?.length) return;

  cookieLines.forEach((cookieLine) => {
    parse(String(cookieLine), { map: false }).forEach((cookie) => {
      if (cookie.name) jar.set(cookie.name, cookie.value);
    });
  });
}

async function saveSetCookieLinesToNative(url, cookieLines) {
  const manager = getNativeCookieManager();
  if (!manager || !url || !cookieLines?.length) return;

  await Promise.all(
    cookieLines.map((line) => manager.setFromResponse(url, String(line)).catch(() => false))
  );
}

export async function saveCookiesFromResponse(jar, headers, url) {
  const cookieLines = readAllSetCookieHeaders(headers);
  saveSetCookieLinesToJar(jar, cookieLines);

  if (!usesNativeCookieStore() || !url) return;

  await saveSetCookieLinesToNative(url, cookieLines);
  await pullNativeCookiesToJar(url, jar);
}

export async function prepareCookieRequest(url, jar, headers) {
  if (usesNativeCookieStore()) {
    await pushJarToNativeCookies(url, jar);
    await pullNativeCookiesToJar(url, jar);
  }

  const cookies = cookieHeader(jar);
  if (cookies) headers.Cookie = cookies;

  return { credentials: 'omit' };
}

export function saveCookiesToJarOnly(jar, headers) {
  saveSetCookieLinesToJar(jar, readAllSetCookieHeaders(headers));
}
