import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearNativeCookies } from './httpCookies';

const THEME_KEY = 'cdv_plan_theme';

export async function wipeAllLocalUserData({
  emailKey,
  passwordKey,
  profilePasswordKey,
  readSavedProfiles,
  secureDeleteItem
}) {
  const profiles = await readSavedProfiles().catch(() => []);

  await Promise.all([
    ...(profiles || []).map((profile) =>
      secureDeleteItem(profilePasswordKey(profile.id), 'hasła profilu').catch(() => {})
    ),
    secureDeleteItem(emailKey, 'loginu').catch(() => {}),
    secureDeleteItem(passwordKey, 'hasła').catch(() => {})
  ]);

  const keys = await AsyncStorage.getAllKeys();
  const toRemove = keys.filter((key) => key !== THEME_KEY);
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);

  await clearNativeCookies();
}
