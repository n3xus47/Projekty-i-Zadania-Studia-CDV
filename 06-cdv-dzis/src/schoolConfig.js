export const SCHOOL_CDV = 'cdv';

export function isCdvStudentLogin(login) {
  const value = String(login || '').trim().toLowerCase();
  return value.includes('@edu.cdv.pl') || value.includes('@cdv.pl');
}

export function detectSchool(login) {
  if (isCdvStudentLogin(login)) return SCHOOL_CDV;
  return null;
}

export function resolveSchoolForLogin(login) {
  return detectSchool(login);
}

export const schoolProfiles = {
  [SCHOOL_CDV]: {
    id: SCHOOL_CDV,
    loginPlaceholder: 'E-mail @edu.cdv.pl lub @cdv.pl',
    portalUrl: 'https://wu.cdv.pl/?login=1',
    subtitle: 'Collegium Da Vinci'
  }
};

export function portalUrlForLogin() {
  return schoolProfiles[SCHOOL_CDV].portalUrl;
}

export function schoolProfileForLogin(school) {
  if (school && schoolProfiles[school]) return schoolProfiles[school];
  return schoolProfiles[SCHOOL_CDV];
}
