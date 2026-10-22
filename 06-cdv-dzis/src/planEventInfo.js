const URL_RE = /\b(?:https?|webcal):\/\/[^\s<>"']+/gi;
const WWW_RE = /\bwww\.[^\s<>"']+/gi;

export const UNKNOWN_ROOM_LABEL = 'Sala nieznana';

function cleanLine(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

export function stripUrlsFromPlanText(value) {
  return String(value || '')
    .replace(URL_RE, ' ')
    .replace(WWW_RE, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function isPlanEventOnline(event) {
  return [event?.locationMode, event?.roomName, event?.buildingName, event?.buildingAddress, event?.hangoutLink, event?.additionalInfo]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes('online'));
}

export function isUnknownRoomName(roomName) {
  const value = cleanLine(roomName);
  if (!value) return true;
  return (
    /^nieznana$/i.test(value)
    || /^sala nieznana$/i.test(value)
    || /^brak danych o sali$/i.test(value)
  );
}

export function formatPlanRoomLabel(event) {
  const raw = cleanLine(event?.roomName);
  if (raw && !isUnknownRoomName(raw)) {
    return raw.toLowerCase().startsWith('sala') ? raw : `Sala ${raw}`;
  }
  if (isPlanEventOnline(event)) return '';
  return UNKNOWN_ROOM_LABEL;
}

export function sanitizePlanAdditionalInfo(event) {
  return stripUrlsFromPlanText(event?.additionalInfo || '');
}

export function shouldShowPlanOnlineLink(event) {
  return Boolean(event?.hangoutLink);
}
