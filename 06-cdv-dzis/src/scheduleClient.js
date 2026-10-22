import { serializeCookieJar } from './portalSession';
import { SCHOOL_CDV } from './schoolConfig';
import { loginAndFetchSchedule as loginAndFetchCdvSchedule, loginToWu } from './wuClient';

const LOGIN_TIMEOUT_MS = 90000;
const SCHEDULE_TIMEOUT_MS = 180000;

function withTimeout(operation, getPhase, timeoutMs, timeoutMessage) {
  let timeout = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      const phase = getPhase?.();
      reject(new Error(`${phase ? `Utknięto na etapie: ${phase}. ` : ''}${timeoutMessage}`));
    }, timeoutMs);
  });

  return Promise.race([operation, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function withScheduleTimeout(operation, getPhase) {
  return withTimeout(operation, getPhase, SCHEDULE_TIMEOUT_MS, 'Pobieranie planu trwa za dlugo. Sprawdz internet i sprobuj ponownie.');
}

export function normalizeScheduleFetchResult(result) {
  if (Array.isArray(result)) {
    return {
      events: result,
      enrichDetails: null,
      portalCookies: null
    };
  }

  return {
    events: result?.events || [],
    enrichDetails: result?.enrichDetails || null,
    portalCookies: result?.portalCookies || null
  };
}

function assertCdvSchool(school) {
  if (school !== SCHOOL_CDV) {
    throw new Error('Ta aplikacja loguje wyłącznie studentów Collegium Da Vinci (@edu.cdv.pl / @cdv.pl).');
  }
}

export async function loginOnly({ school, email, password, onPhase }) {
  assertCdvSchool(school);

  let currentPhase = '';
  const setPhase = (message) => {
    currentPhase = message;
    onPhase?.(message);
  };

  setPhase('CDV: loguję do Wirtualnej Uczelni');
  const jar = await withTimeout(
    loginToWu(email, password, setPhase),
    () => currentPhase,
    LOGIN_TIMEOUT_MS,
    'Logowanie trwa za dlugo. Sprawdz internet i sprobuj ponownie.'
  );
  return {
    school: SCHOOL_CDV,
    cookies: serializeCookieJar(jar)
  };
}

export async function loginAndFetchSchedule({
  school,
  email,
  password,
  startDateKey,
  endDateKey,
  onPhase,
  onStudentProfile
}) {
  assertCdvSchool(school);

  let currentPhase = '';
  const setPhase = (message) => {
    currentPhase = message;
    onPhase?.(message);
  };

  setPhase('CDV: przygotowuję logowanie');
  return withScheduleTimeout(
    loginAndFetchCdvSchedule({
      email,
      password,
      startDateKey,
      endDateKey,
      onPhase: setPhase,
      onStudentProfile
    }),
    () => currentPhase
  );
}
