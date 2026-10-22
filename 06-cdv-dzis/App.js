import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import {
  addDays,
  buildMonthSliderItemsAround,
  dateLabel,
  daysBetween,
  endExclusiveForMode,
  eventTimeRange,
  groupEventsByDay,
  nearestUpcomingEventFocus,
  MONTHS_SHORT,
  rangeTitle,
  semesterRangeForDate,
  startForMode,
  toDateKey
} from './src/dateUtils';
import { StudentDataSection } from './src/StudentDataSection';
import { LegalDocumentModal } from './src/LegalDocumentModal';
import { LegalLinks } from './src/LegalLinks';
import { wipeAllLocalUserData } from './src/wipeLocalData';
import {
  createEmptyStudentProfile,
  mergeAutoStudentProfile,
  readStudentProfile,
  writeStudentProfile
} from './src/studentProfile';
import { buildCookieHeader } from './src/portalSession';
import { eventIdentity, mergeEnrichedEvents, mergeScheduleWithExisting } from './src/eventMerge';
import { formatPlanRoomLabel, isPlanEventOnline, sanitizePlanAdditionalInfo, shouldShowPlanOnlineLink } from './src/planEventInfo';
import { loginAndFetchSchedule, loginOnly, normalizeScheduleFetchResult } from './src/scheduleClient';
import {
  beginLoginAttempt,
  cancelActiveLoginOperations,
  isLoginAttemptCurrent,
  isLoginCancelledError
} from './src/loginCancellation';
import {
  resolveSchoolForLogin,
  schoolProfileForLogin,
  SCHOOL_CDV
} from './src/schoolConfig';
import { WebView } from 'react-native-webview';
import appConfig from './app.json';

const EMAIL_KEY = 'cdv_plan_email';
const PASSWORD_KEY = 'cdv_plan_password';
const PLAN_CACHE_KEY = 'cdv_plan_semester_cache';
const SCHOOL_KEY = 'comamdzis_school';
const PROFILES_KEY = 'comamdzis_saved_profiles';
const REMEMBER_PROFILE_KEY = 'comamdzis_remember_profile';
const THEME_KEY = 'cdv_plan_theme';
const CARD_VISIBILITY_KEY = 'comamdzis_card_visibility';
const BACKGROUND_SYNC_INTERVAL_MS = 15 * 60 * 1000;
const PORTAL_SESSION_TTL_MS = 30 * 60 * 1000;
const CDV_PORTAL_HOME_URL = 'https://wu.cdv.pl/?page=Main';
const CDV_BLACKBOARD_BASE_URL = 'https://cdv.blackboard.com/auth-saml/saml/login?apId=_27_1&redirectUrl=https%3A%2F%2Fcdv.blackboard.com%2Fultra';
const SECURE_STORE_TIMEOUT_MS = 5000;
const APP_ICON = require('./assets/app-icon.png');
const APP_SPLASH_BG = '#0d0618';
SplashScreen.preventAutoHideAsync().catch(() => {});
const THEME_TRANSITION_MS = 160;
const THEME_TRANSITION_EASING = Easing.out(Easing.cubic);
const APP_VERSION = appConfig?.expo?.version || '0.1.0';
const CDV_LOGO = require('./assets/cdv-logo-white.png');
const FONT = {
  body: 'Krub-Regular',
  bodyBold: 'Krub-Bold',
  title: 'Inter-ExtraBold'
};
const BRAND_GRADIENT = ['#7a00df', '#a699fc', '#fb7153'];
const BRAND_GRADIENT_START = { x: 0, y: 1 };
const BRAND_GRADIENT_END = { x: 1, y: 0 };
const BRAND_GRADIENT_TEXT = '#ffffff';
const buildCdvBlackboardUrl = (login) => {
  const normalizedLogin = String(login || '').trim();
  if (!normalizedLogin) return CDV_BLACKBOARD_BASE_URL;
  return `${CDV_BLACKBOARD_BASE_URL}&login_hint=${encodeURIComponent(normalizedLogin)}&domain_hint=organizations`;
};
function isEventCrossedOut(event) {
  return Boolean(event?.isCrossedOut);
}

function eventStatusLabel(event) {
  return String(event?.statusLabel || '').trim();
}

function SavedProfileButton({ loading, onPress, onRemove, savedProfile, styles, theme }) {
  return (
    <View style={styles.profileButton}>
      <Pressable
        disabled={loading}
        onPress={onPress}
        style={({ pressed }) => [styles.profileButtonMain, pressed && styles.profileButtonPressed]}
      >
        <View style={[styles.profileLogoBox, styles.profileLogoBoxDark]}>
          <Image resizeMode="contain" source={CDV_LOGO} style={styles.profileSchoolLogo} />
        </View>
        <View style={styles.profileTextBlock}>
          <Text style={styles.profileLogin}>{savedProfile.login}</Text>
          <Text style={styles.profileSchool}>Collegium Da Vinci</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Usuń zapamiętane konto"
        android_ripple={null}
        disabled={loading}
        onPress={onRemove}
        style={styles.profileRemoveButton}
      >
        <Ionicons color={theme.mutedText} name="close" size={20} />
      </Pressable>
    </View>
  );
}

function AppSplashScreen({ profile }) {
  const dotOne = useRef(new Animated.Value(0)).current;
  const dotTwo = useRef(new Animated.Value(0)).current;
  const dotThree = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      friction: 7,
      tension: 80,
      toValue: 1,
      useNativeDriver: true
    }).start();

    const dotAnimation = Animated.loop(
      Animated.stagger(160, [dotOne, dotTwo, dotThree].map((dot) => (
        Animated.sequence([
          Animated.timing(dot, {
            duration: 360,
            easing: Easing.out(Easing.cubic),
            toValue: 1,
            useNativeDriver: true
          }),
          Animated.timing(dot, {
            duration: 420,
            easing: Easing.in(Easing.cubic),
            toValue: 0.28,
            useNativeDriver: true
          })
        ])
      )))
    );

    dotAnimation.start();
    return () => dotAnimation.stop();
  }, [dotOne, dotThree, dotTwo, logoScale]);

  return (
    <View style={appSplashStyles.screen}>
      <Animated.View style={[appSplashStyles.logoWrap, { transform: [{ scale: logoScale }] }]}>
        <Image resizeMode="contain" source={APP_ICON} style={appSplashStyles.logo} />
      </Animated.View>
      {profile?.login ? <Text style={appSplashStyles.login}>{profile.login}</Text> : null}
      <View accessibilityLabel="Ładowanie" style={appSplashStyles.dots}>
        {[dotOne, dotTwo, dotThree].map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              appSplashStyles.dot,
              {
                opacity: dot,
                transform: [{
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [4, -4]
                  })
                }]
              }
            ]}
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              end={BRAND_GRADIENT_END}
              start={BRAND_GRADIENT_START}
              style={appSplashStyles.dotFill}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const appSplashStyles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: APP_SPLASH_BG,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 28
  },
  logoWrap: {
    alignItems: 'center',
    height: 108,
    justifyContent: 'center',
    marginBottom: 14,
    width: 108
  },
  logo: {
    borderRadius: 24,
    height: 96,
    width: 96
  },
  login: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 18,
    textAlign: 'center'
  },
  dots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    height: 18,
    justifyContent: 'center'
  },
  dot: {
    borderRadius: 4,
    height: 8,
    overflow: 'hidden',
    width: 8
  },
  dotFill: {
    flex: 1
  }
});

function BrandPillButton({ active, activeTextStyle, label, onPress, style, textStyle }) {
  if (active) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={BRAND_GRADIENT}
          end={BRAND_GRADIENT_END}
          start={BRAND_GRADIENT_START}
          style={style}
        >
          <Text style={activeTextStyle}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={style}>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

function ToolbarRangeTitle({ styles, text }) {
  return (
    <View style={styles.rangeTitleRow}>
      <MaskedView
        maskElement={(
          <View style={styles.rangeTitleMaskWrap}>
            <Text adjustsFontSizeToFit minimumFontScale={0.85} numberOfLines={1} style={styles.rangeTitleMask}>
              {text}
            </Text>
          </View>
        )}
        style={styles.rangeTitleGradient}
      >
        <LinearGradient
          colors={BRAND_GRADIENT}
          end={BRAND_GRADIENT_END}
          start={BRAND_GRADIENT_START}
          style={styles.rangeTitleGradientFill}
        />
      </MaskedView>
    </View>
  );
}

const DEFAULT_CARD_VISIBILITY = {
  address: true,
  group: true,
  teacher: true,
  info: true
};

const CARD_VISIBILITY_FIELDS = [
  { key: 'address', icon: 'location-outline', label: 'Adres' },
  { key: 'group', icon: 'people-outline', label: 'Grupa' },
  { key: 'teacher', icon: 'person-outline', label: 'Prowadzący' },
  { key: 'info', icon: 'information-circle-outline', label: 'Informacje' }
];

const SETTINGS_DRAWER_RATIO = 0.8;
const SETTINGS_EDGE_SWIPE_WIDTH = 28;
const SETTINGS_DRAG_OPEN_THRESHOLD = 0.35;
const SETTINGS_CONTENT_SCRIM_OPACITY = 0.45;
const SETTINGS_DRAWER_LOGO_SIZE = 72;
const SETTINGS_TOGGLE_HEIGHT = 30;
const SETTINGS_TOGGLE_WIDTH = 52;
const SETTINGS_TOGGLE_PADDING = 3;
const SETTINGS_TOGGLE_THUMB = SETTINGS_TOGGLE_HEIGHT - SETTINGS_TOGGLE_PADDING * 2;
const SETTINGS_TOGGLE_TRAVEL = SETTINGS_TOGGLE_WIDTH - SETTINGS_TOGGLE_THUMB - SETTINGS_TOGGLE_PADDING * 2;

function parseCardVisibility(raw) {
  if (!raw) return DEFAULT_CARD_VISIBILITY;
  try {
    return { ...DEFAULT_CARD_VISIBILITY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CARD_VISIBILITY;
  }
}

const MONTH_SLIDER_YEAR_WIDTH = 56;
const MONTH_SLIDER_ITEM_WIDTH = 52;
const MONTH_SLIDER_YEARS = 5;
const MONTH_SLIDER_GAP = 4;
const MONTH_SLIDER_PADDING = 16;

function monthSliderItemWidth(item) {
  return item.type === 'year' ? MONTH_SLIDER_YEAR_WIDTH : MONTH_SLIDER_ITEM_WIDTH;
}

function monthSliderOffsetForIndex(items, index) {
  let offset = MONTH_SLIDER_PADDING;
  for (let i = 0; i < index; i += 1) {
    offset += monthSliderItemWidth(items[i]);
    offset += MONTH_SLIDER_GAP;
  }
  return offset;
}

const MonthSlider = memo(function MonthSlider({ anchorDate, items, onSelectMonth, open, styles }) {
  const scrollRef = useRef(null);
  const sliderWidthRef = useRef(0);
  const itemsRef = useRef(items);
  const highlightIndexRef = useRef(-1);
  const highlightYear = anchorDate.getFullYear();
  const highlightMonth = anchorDate.getMonth();

  itemsRef.current = items;

  const highlightIndex = useMemo(
    () =>
      items.findIndex(
        (item) =>
          item.type === 'month' &&
          item.date.getFullYear() === highlightYear &&
          item.date.getMonth() === highlightMonth
      ),
    [highlightMonth, highlightYear, items]
  );

  highlightIndexRef.current = highlightIndex;

  const scrollToHighlight = useCallback(() => {
    const index = highlightIndexRef.current;
    const list = itemsRef.current;
    if (index < 0 || !scrollRef.current || !sliderWidthRef.current) return;

    const itemOffset = monthSliderOffsetForIndex(list, index);
    const itemWidth = monthSliderItemWidth(list[index]);
    const centeredOffset = itemOffset + itemWidth / 2 - sliderWidthRef.current / 2;

    scrollRef.current.scrollTo({ x: Math.max(0, centeredOffset), animated: false });
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => scrollToHighlight());
  }, [open, scrollToHighlight]);

  const onSliderLayout = useCallback(
    (event) => {
      const { width } = event.nativeEvent.layout;
      if (width === sliderWidthRef.current) return;
      sliderWidthRef.current = width;
      if (open) {
        requestAnimationFrame(() => scrollToHighlight());
      }
    },
    [open, scrollToHighlight]
  );

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      nestedScrollEnabled
      onLayout={onSliderLayout}
      showsHorizontalScrollIndicator={false}
      style={styles.monthSlider}
      contentContainerStyle={styles.monthSliderContent}
    >
      {items.map((item) => {
        if (item.type === 'year') {
          return (
            <View key={`year-${item.year}`} style={styles.monthSliderYear}>
              <Text style={styles.monthSliderYearText}>{item.year}</Text>
            </View>
          );
        }

        const active =
          item.date.getFullYear() === highlightYear && item.date.getMonth() === highlightMonth;

        return (
          <BrandPillButton
            active={active}
            activeTextStyle={styles.monthSliderItemTextActive}
            key={`${item.date.getFullYear()}-${item.date.getMonth()}`}
            label={MONTHS_SHORT[item.date.getMonth()]}
            onPress={() => onSelectMonth(item.date)}
            style={styles.monthSliderItem}
            textStyle={styles.monthSliderItemText}
          />
        );
      })}
    </ScrollView>
  );
});

const themes = {
  light: {
    name: 'light',
    appBg: '#FFFFFF',
    headerBg: '#050505',
    screenBg: '#FFFFFF',
    panelBg: '#ffffff',
    panelAlt: '#f5f5f5',
    surfaceBg: '#eeeeee',
    surfaceBgActive: '#dddddd',
    text: '#000000',
    fieldText: '#000000',
    mutedText: '#666666',
    secondaryText: '#525252',
    formMuted: '#999999',
    formFocus: '#7a00df',
    checkboxCheck: '#ffffff',
    passwordIcon: '#000000',
    primaryButtonText: '#ffffff',
    rememberText: '#000000',
    border: '#cccccc',
    metaBadgeBorder: '#d1d5db',
    divider: '#e5e5e5',
    segmentedBg: '#eeeeee',
    activeBg: '#ffffff',
    accent: '#7a00df',
    accentDark: '#66c981',
    shadow: '#000000'
  },
  dark: {
    name: 'dark',
    appBg: '#050505',
    headerBg: '#050505',
    screenBg: '#050505',
    panelBg: '#1e1e1e',
    panelAlt: '#141414',
    surfaceBg: '#262626',
    surfaceBgActive: '#333333',
    text: '#ffffff',
    fieldText: '#ffffff',
    mutedText: '#aaaaaa',
    secondaryText: '#cccccc',
    formMuted: '#666666',
    formFocus: '#a699fc',
    checkboxCheck: '#ffffff',
    passwordIcon: '#ffffff',
    primaryButtonText: '#ffffff',
    rememberText: '#ffffff',
    border: '#404040',
    metaBadgeBorder: '#525252',
    divider: '#333333',
    segmentedBg: '#2a2a2a',
    activeBg: '#3a3a3a',
    accent: '#a699fc',
    accentDark: '#66c981',
    shadow: '#000000'
  }
};

function hexToRgb(hex) {
  const raw = String(hex || '').replace('#', '');
  const normalized = raw.length === 3
    ? raw.split('').map((part) => `${part}${part}`).join('')
    : raw;
  return {
    r: parseInt(normalized.slice(0, 2), 16) || 0,
    g: parseInt(normalized.slice(2, 4), 16) || 0,
    b: parseInt(normalized.slice(4, 6), 16) || 0
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const THEME_COLOR_KEYS = Object.keys(themes.light).filter((key) => {
  const value = themes.light[key];
  return typeof value === 'string' && value.startsWith('#');
});

const THEME_RGB = {
  light: Object.fromEntries(THEME_COLOR_KEYS.map((key) => [key, hexToRgb(themes.light[key])])),
  dark: Object.fromEntries(THEME_COLOR_KEYS.map((key) => [key, hexToRgb(themes.dark[key])]))
};

function mixThemes(fromTheme, toTheme, progress) {
  const t = Math.max(0, Math.min(1, progress));
  const next = { ...fromTheme, name: t >= 0.5 ? toTheme.name : fromTheme.name };
  const fromRgb = THEME_RGB[fromTheme.name] || THEME_RGB.light;
  const toRgb = THEME_RGB[toTheme.name] || THEME_RGB.dark;
  for (let i = 0; i < THEME_COLOR_KEYS.length; i += 1) {
    const key = THEME_COLOR_KEYS[i];
    const from = fromRgb[key];
    const to = toRgb[key];
    next[key] = rgbToHex({
      r: from.r + (to.r - from.r) * t,
      g: from.g + (to.g - from.g) * t,
      b: from.b + (to.b - from.b) * t
    });
  }
  return next;
}

function describeChanges(previousEvents, nextEvents) {
  if (!previousEvents.length) return null;

  const previous = new Map(previousEvents.map((event) => [eventIdentity(event), event]));
  const next = new Map(nextEvents.map((event) => [eventIdentity(event), event]));
  const added = nextEvents.filter((event) => !previous.has(eventIdentity(event)));
  const removed = previousEvents.filter((event) => !next.has(eventIdentity(event)));

  if (!added.length && !removed.length) return null;

  const parts = [];
  if (added.length) {
    parts.push(`Nowe zajęcia: ${added.length}`);
    parts.push(...added.slice(0, 3).map((event) => `+ ${dateLabel(new Date(event.start))}, ${eventTimeRange(event)} ${event.title}`));
  }
  if (removed.length) {
    parts.push(`Odwołane/usunięte zajęcia: ${removed.length}`);
    parts.push(...removed.slice(0, 3).map((event) => `- ${dateLabel(new Date(event.start))}, ${eventTimeRange(event)} ${event.title}`));
  }
  if (added.length + removed.length > 6) parts.push('Pokazuję tylko kilka pierwszych zmian.');

  return parts.join('\n');
}

function safeStorageKeyPart(value) {
  return String(value || 'default').trim().toLowerCase().replace(/[^A-Za-z0-9._-]/g, '_');
}

function cacheKeyForSchool(school) {
  return `${PLAN_CACHE_KEY}_${school}`;
}

function cacheKeyForProfile(school, login) {
  return `${PLAN_CACHE_KEY}_${safeStorageKeyPart(school)}_${safeStorageKeyPart(login)}`;
}

async function readPlanCache(school, login) {
  const cacheKeys = [
    login ? cacheKeyForProfile(school, login) : '',
    cacheKeyForSchool(school),
    school === SCHOOL_CDV ? PLAN_CACHE_KEY : ''
  ].filter(Boolean);
  const rawValues = await Promise.all(cacheKeys.map((key) => AsyncStorage.getItem(key)));
  const raw = rawValues.find(Boolean);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writePlanCache(school, login, cache) {
  const raw = JSON.stringify(cache);
  await AsyncStorage.setItem(cacheKeyForProfile(school, login), raw);
}

function profileIdFor(login, school) {
  return `${school}:${String(login || '').trim().toLowerCase()}`;
}

function profilePasswordKey(profileId) {
  return `comamdzis_profile_password_${safeStorageKeyPart(profileId)}`;
}

async function readSavedProfiles() {
  const raw = await AsyncStorage.getItem(PROFILES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((profile) => profile?.school === SCHOOL_CDV);
  } catch {
    return [];
  }
}

async function writeSavedProfiles(profiles) {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

function withTimeout(promise, message, timeoutMs = SECURE_STORE_TIMEOUT_MS) {
  let timeout = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

function secureGetItem(key, label) {
  return withTimeout(SecureStore.getItemAsync(key), `SecureStore: odczyt ${label} trwa za długo.`);
}

function secureSetItem(key, value, label) {
  return withTimeout(SecureStore.setItemAsync(key, value), `SecureStore: zapis ${label} trwa za długo.`);
}

function secureDeleteItem(key, label) {
  return withTimeout(SecureStore.deleteItemAsync(key), `SecureStore: usuwanie ${label} trwa za długo.`);
}

async function upsertSavedProfile({ login, password, school }) {
  const trimmedLogin = login.trim();
  const id = profileIdFor(trimmedLogin, school);
  const previous = await readSavedProfiles();
  const nextProfile = {
    id,
    login: trimmedLogin,
    school,
    updatedAt: new Date().toISOString()
  };
  const next = [nextProfile, ...previous.filter((profile) => profile.id !== id)];

  await Promise.all([
    writeSavedProfiles(next),
    secureSetItem(profilePasswordKey(id), password, 'hasła profilu')
  ]);

  return next;
}

async function removeSavedProfile(profileId) {
  const next = (await readSavedProfiles()).filter((profile) => profile.id !== profileId);

  await Promise.all([
    writeSavedProfiles(next),
    secureDeleteItem(profilePasswordKey(profileId), 'hasła profilu').catch(() => {})
  ]);

  return next;
}

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('today');
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState(null);
  const [portalWebView, setPortalWebView] = useState(null);
  const [themeName, setThemeName] = useState('light');
  const [displayTheme, setDisplayTheme] = useState(themes.light);
  const [school, setSchool] = useState(SCHOOL_CDV);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [rememberProfile, setRememberProfile] = useState(true);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [profileLoginLoadingProfile, setProfileLoginLoadingProfile] = useState(null);
  const [loginPhase, setLoginPhase] = useState('');
  const [deleteProfileConfirm, setDeleteProfileConfirm] = useState(null);
  const [monthSliderOpen, setMonthSliderOpen] = useState(false);
  const [cardVisibility, setCardVisibility] = useState(DEFAULT_CARD_VISIBILITY);
  const [studentProfile, setStudentProfile] = useState(createEmptyStudentProfile);

  const eventsRef = useRef([]);
  const syncInProgressRef = useRef(false);
  const skipImmediateSyncRef = useRef(false);
  const skipThemeAnimationRef = useRef(true);
  const themeProgress = useRef(new Animated.Value(0)).current;
  const themeAnimFrameRef = useRef(null);
  const themeAnimValueRef = useRef(0);
  const portalSessionCacheRef = useRef(null);
  const enrichInProgressRef = useRef(false);
  const enrichSyncGenerationRef = useRef(0);
  const pendingEnrichedRef = useRef([]);
  const enrichFlushTimerRef = useRef(null);
  const loginPhaseRef = useRef('');
  const anchorDateRef = useRef(anchorDate);
  const modeRef = useRef(mode);
  const detectedSchool = resolveSchoolForLogin(email, password);
  const loginSchool = saved ? school : detectedSchool;
  const profile = schoolProfileForLogin(loginSchool);
  const loginKeyboardType = 'email-address';
  const theme = displayTheme;
  const [fontsLoaded] = useFonts({
    [FONT.body]: require('./assets/fonts/Krub-Regular.ttf'),
    [FONT.bodyBold]: require('./assets/fonts/Krub-Bold.ttf'),
    [FONT.title]: require('./assets/fonts/Inter-ExtraBold.ttf')
  });

  useEffect(() => {
    if (!fontsLoaded) return undefined;
    SplashScreen.hideAsync().catch(() => {});
    return undefined;
  }, [fontsLoaded]);

  const styles = useMemo(() => createStyles(theme), [theme]);
  const semesterRange = useMemo(() => semesterRangeForDate(anchorDate), [anchorDate]);
  const semesterSyncKey = useMemo(
    () => `${semesterRange.startKey}:${semesterRange.endKey}`,
    [semesterRange]
  );
  const monthSliderItems = useMemo(
    () => buildMonthSliderItemsAround(new Date(), MONTH_SLIDER_YEARS, MONTH_SLIDER_YEARS),
    []
  );

  const range = useMemo(() => {
    const start = startForMode(anchorDate, mode);
    const end = endExclusiveForMode(anchorDate, mode);
    return {
      start,
      end,
      startKey: toDateKey(start),
      endKey: toDateKey(end),
      title: rangeTitle(start, end, mode)
    };
  }, [anchorDate, mode]);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => {
      const start = new Date(event.start);
      return start >= range.start && start < range.end;
    });
  }, [events, range]);

  const groupedEvents = useMemo(() => groupEventsByDay(visibleEvents), [visibleEvents]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    anchorDateRef.current = anchorDate;
  }, [anchorDate]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    restoreCredentialsAndCache();
  }, []);

  useEffect(() => {
    const listenerId = themeProgress.addListener(({ value }) => {
      themeAnimValueRef.current = value;
      if (themeAnimFrameRef.current != null) return;
      themeAnimFrameRef.current = requestAnimationFrame(() => {
        themeAnimFrameRef.current = null;
        setDisplayTheme(mixThemes(themes.light, themes.dark, themeAnimValueRef.current));
      });
    });

    return () => {
      themeProgress.removeListener(listenerId);
      if (themeAnimFrameRef.current != null) {
        cancelAnimationFrame(themeAnimFrameRef.current);
        themeAnimFrameRef.current = null;
      }
    };
  }, [themeProgress]);

  useEffect(() => {
    if (skipThemeAnimationRef.current) {
      skipThemeAnimationRef.current = false;
      themeProgress.setValue(themeName === 'dark' ? 1 : 0);
      setDisplayTheme(themes[themeName]);
      return undefined;
    }

    const animation = Animated.timing(themeProgress, {
      duration: THEME_TRANSITION_MS,
      easing: THEME_TRANSITION_EASING,
      toValue: themeName === 'dark' ? 1 : 0,
      useNativeDriver: false
    });

    animation.start(({ finished }) => {
      if (finished) setDisplayTheme(themes[themeName]);
    });

    return () => animation.stop();
  }, [themeName, themeProgress]);

  const updateLoginPhase = useCallback((message = '') => {
    loginPhaseRef.current = message;
    setLoginPhase(message);
  }, []);

  const rememberPortalSession = useCallback((activeSchool, portalCookies) => {
    if (!portalCookies?.length) return;
    portalSessionCacheRef.current = {
      school: activeSchool,
      cookies: portalCookies,
      fetchedAt: Date.now()
    };
  }, []);

  const cancelPendingEnrichFlush = useCallback(() => {
    if (enrichFlushTimerRef.current) {
      clearTimeout(enrichFlushTimerRef.current);
      enrichFlushTimerRef.current = null;
    }
    pendingEnrichedRef.current = [];
  }, []);

  const cancelActiveLogin = useCallback(() => {
    cancelActiveLoginOperations();
    syncInProgressRef.current = false;
    enrichSyncGenerationRef.current += 1;
    cancelPendingEnrichFlush();
    enrichInProgressRef.current = false;
    setProfileLoginLoadingProfile(null);
    setLoading(false);
    setSyncing(false);
    updateLoginPhase('');
  }, [cancelPendingEnrichFlush, updateLoginPhase]);

  const enrichScheduleDetailsInBackground = useCallback(async ({ activeSchool, enrichDetails, loginEmail, syncGeneration }) => {
    if (!enrichDetails) return;
    if (syncGeneration !== undefined && syncGeneration !== enrichSyncGenerationRef.current) return;

    if (enrichInProgressRef.current) {
      cancelPendingEnrichFlush();
      enrichInProgressRef.current = false;
    }

    const myGeneration = syncGeneration ?? enrichSyncGenerationRef.current;
    enrichInProgressRef.current = true;
    pendingEnrichedRef.current = [];

    const isStale = () => myGeneration !== enrichSyncGenerationRef.current;

    const flushEnrichedBatch = () => {
      if (isStale()) return;
      const batch = pendingEnrichedRef.current;
      if (!batch.length) return;
      pendingEnrichedRef.current = [];
      setEvents((current) => {
        const merged = mergeEnrichedEvents(current, batch);
        eventsRef.current = merged;
        return merged;
      });
    };

    const queueEnrichedEvent = (enriched) => {
      if (isStale()) return;
      pendingEnrichedRef.current.push(enriched);
      if (enrichFlushTimerRef.current) return;
      enrichFlushTimerRef.current = setTimeout(() => {
        enrichFlushTimerRef.current = null;
        flushEnrichedBatch();
      }, 120);
    };

    try {
      await enrichDetails({
        focusDate: anchorDateRef.current,
        onEventEnriched: queueEnrichedEvent
      });
      if (isStale()) return;
      if (enrichFlushTimerRef.current) {
        clearTimeout(enrichFlushTimerRef.current);
        enrichFlushTimerRef.current = null;
      }
      flushEnrichedBatch();
      await writePlanCache(activeSchool, loginEmail, {
        events: eventsRef.current,
        lastSync: new Date().toISOString(),
        semesterStartKey: semesterRange.startKey,
        semesterEndKey: semesterRange.endKey
      });
    } catch {
    } finally {
      if (!isStale()) {
        enrichInProgressRef.current = false;
      }
    }
  }, [cancelPendingEnrichFlush, semesterRange]);

  const applyAutoStudentProfile = useCallback(async (activeSchool, loginEmail, autoPatch) => {
    if (!activeSchool || !loginEmail || !autoPatch) return;
    const stored = await readStudentProfile(activeSchool, loginEmail);
    const merged = mergeAutoStudentProfile(stored, autoPatch);
    await writeStudentProfile(activeSchool, loginEmail, merged);
    setStudentProfile(merged);
    return merged;
  }, []);

  const loadStudentProfileForAccount = useCallback(async (activeSchool, loginEmail) => {
    if (!activeSchool || !loginEmail) {
      setStudentProfile(createEmptyStudentProfile());
      return;
    }

    let profile = await readStudentProfile(activeSchool, loginEmail);
    if (activeSchool === SCHOOL_CDV) {
      profile = {
        ...profile,
        university: 'Collegium Da Vinci'
      };
    }
    setStudentProfile(profile);
  }, []);

  const syncSemester = useCallback(
    async ({
      nextEmail = email,
      nextPassword = password,
      showLoader = false,
      notifyChanges = true,
      showErrors = false,
      forceStart = false
    } = {}) => {
      if (!nextEmail?.trim() || !nextPassword) return false;
      if (syncInProgressRef.current) {
        if (!forceStart) return false;
        syncInProgressRef.current = false;
      }

      const nextSchool = resolveSchoolForLogin(nextEmail, nextPassword);
      syncInProgressRef.current = true;
      const attemptId = beginLoginAttempt();
      if (showLoader || !eventsRef.current.length) setLoading(true);
      else setSyncing(true);
      updateLoginPhase(`Start logowania: ${schoolProfileForLogin(nextSchool)?.subtitle || 'Collegium Da Vinci'}`);

      try {
        const scheduleResult = normalizeScheduleFetchResult(await loginAndFetchSchedule({
          school: nextSchool,
          email: nextEmail.trim(),
          password: nextPassword,
          startDateKey: semesterRange.startKey,
          endDateKey: semesterRange.endKey,
          onPhase: updateLoginPhase,
          onStudentProfile: (autoPatch) => applyAutoStudentProfile(nextSchool, nextEmail.trim(), autoPatch)
        }));
        if (!isLoginAttemptCurrent(attemptId)) return false;
        const previousEvents = eventsRef.current;
        enrichSyncGenerationRef.current += 1;
        const syncGeneration = enrichSyncGenerationRef.current;
        cancelPendingEnrichFlush();
        enrichInProgressRef.current = false;

        const nextEvents = mergeScheduleWithExisting(previousEvents, scheduleResult.events);
        rememberPortalSession(nextSchool, scheduleResult.portalCookies);
        const changes = notifyChanges ? describeChanges(previousEvents, nextEvents) : null;
        const syncedAt = new Date();

        eventsRef.current = nextEvents;
        setEvents(nextEvents);
        setLastSync(syncedAt);
        await writePlanCache(nextSchool, nextEmail.trim(), {
          events: nextEvents,
          lastSync: syncedAt.toISOString(),
          semesterStartKey: semesterRange.startKey,
          semesterEndKey: semesterRange.endKey
        });

        if (scheduleResult.enrichDetails) {
          void enrichScheduleDetailsInBackground({
            activeSchool: nextSchool,
            enrichDetails: scheduleResult.enrichDetails,
            loginEmail: nextEmail.trim(),
            syncGeneration
          });
        }

        if (changes) {
          Alert.alert('Zmiany w planie', changes);
        }
        return true;
      } catch (error) {
        if (!isLoginAttemptCurrent(attemptId) || isLoginCancelledError(error)) {
          return false;
        }
        if (showErrors || !eventsRef.current.length) {
          const phase = loginPhaseRef.current ? `Etap: ${loginPhaseRef.current}\n\n` : '';
          Alert.alert('Nie udało się wczytać planu', `${phase}${error.message || 'Dane logowania są nieprawidłowe.'}`);
        }
        return false;
      } finally {
        setLoading(false);
        setSyncing(false);
        setProfileLoginLoadingProfile(null);
        syncInProgressRef.current = false;
        updateLoginPhase('');
      }
    },
    [applyAutoStudentProfile, cancelPendingEnrichFlush, email, enrichScheduleDetailsInBackground, password, rememberPortalSession, semesterRange, updateLoginPhase]
  );

  useEffect(() => {
    if (!saved || !email || !password) return undefined;

    const skipImmediate = skipImmediateSyncRef.current;
    skipImmediateSyncRef.current = false;
    if (!skipImmediate) {
      syncSemester({ notifyChanges: eventsRef.current.length > 0, showErrors: eventsRef.current.length === 0 });
    }

    const interval = setInterval(() => {
      syncSemester({ notifyChanges: true, showErrors: false });
    }, BACKGROUND_SYNC_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncSemester({ notifyChanges: true, showErrors: false });
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [email, password, saved, semesterSyncKey, syncSemester]);

  const toggleCardVisibility = useCallback((key) => {
    setCardVisibility((current) => {
      const next = { ...current, [key]: !current[key] };
      AsyncStorage.setItem(CARD_VISIBILITY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const selectMonth = useCallback((date) => {
    setMode('month');
    setAnchorDate(new Date(date.getFullYear(), date.getMonth(), 1));
  }, []);

  const openCdvPortal = useCallback(async ({ target = 'wu', title, url }) => {
    const portalAutoLogin = email.trim() && password
      ? { email: email.trim(), password, school: SCHOOL_CDV, target }
      : null;

    if (!url) return;

    setSettingsOpen(false);

    const cachedPortal = portalSessionCacheRef.current;
    if (
      cachedPortal?.school === SCHOOL_CDV &&
      cachedPortal.cookies?.length &&
      Date.now() - cachedPortal.fetchedAt < PORTAL_SESSION_TTL_MS
    ) {
      setPortalWebView({
        autoLogin: portalAutoLogin,
        cookies: cachedPortal.cookies,
        title,
        url
      });
      return;
    }

    if (!email.trim() || !password) {
      Linking.openURL(url).catch(() => {});
      return;
    }

    setPortalWebView({ autoLogin: portalAutoLogin, loading: true, title, url });

    try {
      const portalSession = await loginOnly({
        school: SCHOOL_CDV,
        email: email.trim(),
        password,
        onPhase: () => {}
      });
      rememberPortalSession(SCHOOL_CDV, portalSession.cookies || []);
      setPortalWebView({
        autoLogin: portalAutoLogin,
        cookies: portalSession.cookies || [],
        title,
        url
      });
    } catch {
      setPortalWebView(null);
      Linking.openURL(url).catch(() => {});
    }
  }, [email, password, rememberPortalSession]);

  const openUniversityPortal = useCallback(() => {
    openCdvPortal({ title: 'Twoja Uczelnia', url: CDV_PORTAL_HOME_URL });
  }, [openCdvPortal]);

  const openBlackboardPortal = useCallback(() => {
    openCdvPortal({ target: 'blackboard', title: 'Blackboard', url: buildCdvBlackboardUrl(email) });
  }, [email, openCdvPortal]);

  function updateEmail(value) {
    setEmail(value);
    setSchool(resolveSchoolForLogin(value, password));
  }

  function updatePassword(value) {
    setPassword(value);
    setSchool(resolveSchoolForLogin(email, value));
  }

  if (!fontsLoaded) {
    return (
      <>
        <StatusBar style="light" />
        <AppSplashScreen />
      </>
    );
  }

  async function restoreCredentialsAndCache() {
    const [storedEmail, storedPassword, , storedTheme, storedRemember, storedCardVisibility, profiles] =
      await Promise.all([
      secureGetItem(EMAIL_KEY, 'loginu').catch(() => null),
      secureGetItem(PASSWORD_KEY, 'hasła').catch(() => null),
      AsyncStorage.getItem(SCHOOL_KEY),
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(REMEMBER_PROFILE_KEY),
      AsyncStorage.getItem(CARD_VISIBILITY_KEY),
      readSavedProfiles()
    ]);
    const resolvedSchool = resolveSchoolForLogin(storedEmail, storedPassword);
    const cachedPlan = resolvedSchool === SCHOOL_CDV
      ? await readPlanCache(SCHOOL_CDV, storedEmail)
      : null;

    setSavedProfiles(profiles);
    if (storedRemember === 'false') setRememberProfile(false);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      if (storedTheme !== themeName) {
        skipThemeAnimationRef.current = true;
      }
      setThemeName(storedTheme);
      setDisplayTheme(themes[storedTheme]);
      themeProgress.setValue(storedTheme === 'dark' ? 1 : 0);
    }
    setCardVisibility(parseCardVisibility(storedCardVisibility));
    setSchool(SCHOOL_CDV);
    if (resolvedSchool === SCHOOL_CDV && cachedPlan?.events?.length) {
      setEvents(cachedPlan.events);
      if (cachedPlan.lastSync) setLastSync(new Date(cachedPlan.lastSync));
    }
    if (storedEmail) setEmail(storedEmail);
    if (storedPassword && resolvedSchool === SCHOOL_CDV) {
      setPassword(storedPassword);
    }
    if (storedEmail && storedPassword && resolvedSchool === SCHOOL_CDV) {
      setSaved(true);
      await loadStudentProfileForAccount(SCHOOL_CDV, storedEmail);
      if (storedRemember !== 'false') {
        upsertSavedProfile({ login: storedEmail, password: storedPassword, school: SCHOOL_CDV })
          .then(setSavedProfiles)
          .catch(() => {});
      }
    }
  }

  async function saveCredentialsAndRefresh() {
    const loginValue = email.trim();
    const nextSchool = resolveSchoolForLogin(loginValue, password);

    Keyboard.dismiss();

    if (!loginValue) {
      Alert.alert('Brak danych', 'Wpisz e-mail studenta Collegium Da Vinci (@edu.cdv.pl lub @cdv.pl).');
      return;
    }

    if (nextSchool !== SCHOOL_CDV) {
      Alert.alert(
        'Tylko Collegium Da Vinci',
        'CDV Dziś jest aplikacją wyłącznie dla studentów i pracowników Collegium Da Vinci. Zaloguj się kontem @edu.cdv.pl lub @cdv.pl.'
      );
      return;
    }

    if (!password) {
      Alert.alert('Brak danych', 'Wpisz uczelniany e-mail i hasło.');
      return;
    }

    const loginPassword = password;

    syncInProgressRef.current = false;
    const attemptId = beginLoginAttempt();
    setLoading(true);
    setSyncing(false);
    setSchool(nextSchool);
    updateLoginPhase(`Loguję: ${schoolProfileForLogin(nextSchool)?.subtitle || 'Collegium Da Vinci'}`);

    let credentialsToSave = loginPassword;

    try {
      const scheduleResult = normalizeScheduleFetchResult(await loginAndFetchSchedule({
        school: nextSchool,
        email: loginValue,
        password: loginPassword,
        startDateKey: semesterRange.startKey,
        endDateKey: semesterRange.endKey,
        onCredentials: (credentials) => {
          credentialsToSave = credentials;
        },
        onPhase: updateLoginPhase,
        onStudentProfile: (autoPatch) => applyAutoStudentProfile(nextSchool, loginValue, autoPatch)
      }));
      if (!isLoginAttemptCurrent(attemptId)) return;
      const previousEvents = eventsRef.current;
      enrichSyncGenerationRef.current += 1;
      const syncGeneration = enrichSyncGenerationRef.current;
      cancelPendingEnrichFlush();
      enrichInProgressRef.current = false;

      const nextEvents = mergeScheduleWithExisting(previousEvents, scheduleResult.events);
      rememberPortalSession(nextSchool, scheduleResult.portalCookies);
      const syncedAt = new Date();

      eventsRef.current = nextEvents;
      setEvents(nextEvents);
      setLastSync(syncedAt);
      await writePlanCache(nextSchool, loginValue, {
        events: nextEvents,
        lastSync: syncedAt.toISOString(),
        semesterStartKey: semesterRange.startKey,
        semesterEndKey: semesterRange.endKey
      });
      if (scheduleResult.enrichDetails) {
        void enrichScheduleDetailsInBackground({
          activeSchool: nextSchool,
          enrichDetails: scheduleResult.enrichDetails,
          loginEmail: loginValue,
          syncGeneration
        });
      }
    } catch (error) {
      if (!isLoginAttemptCurrent(attemptId) || isLoginCancelledError(error)) {
        setLoading(false);
        updateLoginPhase('');
        return;
      }
      const phase = loginPhaseRef.current ? `Etap: ${loginPhaseRef.current}\n\n` : '';
      Alert.alert('Nie udało się wczytać planu', `${phase}${error.message || 'Dane logowania są nieprawidłowe.'}`);
      setLoading(false);
      updateLoginPhase('');
      return;
    }

    setEmail(loginValue);
    setPassword(credentialsToSave);
    setSchool(nextSchool);
    skipImmediateSyncRef.current = true;
    setSaved(true);
    await loadStudentProfileForAccount(nextSchool, loginValue);

    updateLoginPhase('Zapisuję profil na telefonie');

    try {
      await AsyncStorage.setItem(REMEMBER_PROFILE_KEY, rememberProfile ? 'true' : 'false');
      if (rememberProfile) {
        await Promise.all([
          secureSetItem(EMAIL_KEY, loginValue, 'loginu'),
          secureSetItem(PASSWORD_KEY, credentialsToSave, 'hasła'),
          AsyncStorage.setItem(SCHOOL_KEY, nextSchool)
        ]);
        setSavedProfiles(await upsertSavedProfile({ login: loginValue, password: credentialsToSave, school: nextSchool }));
      } else {
        await Promise.all([
          secureDeleteItem(EMAIL_KEY, 'loginu'),
          secureDeleteItem(PASSWORD_KEY, 'hasła'),
          AsyncStorage.removeItem(SCHOOL_KEY)
        ]);
      }
    } catch (error) {
      Alert.alert('Zalogowano', error.message || 'Nie udało się zapisać profilu, ale aplikacja jest już otwarta.');
    } finally {
      setLoading(false);
      updateLoginPhase('');
    }
  }

  function confirmDeleteSavedProfile(profile) {
    setDeleteProfileConfirm(profile);
  }

  async function handleConfirmDeleteSavedProfile() {
    if (!deleteProfileConfirm) return;

    try {
      setSavedProfiles(await removeSavedProfile(deleteProfileConfirm.id));
      setDeleteProfileConfirm(null);
    } catch (error) {
      Alert.alert('Nie udało się usunąć konta', error.message || 'Spróbuj ponownie.');
    }
  }

  async function loginWithProfile(profile) {
    syncInProgressRef.current = false;
    Keyboard.dismiss();
    setProfileLoginLoadingProfile(profile);
    setLoading(true);
    setSyncing(false);
    updateLoginPhase(`Odczytuję zapamiętany profil: ${profile.login}`);
    let profilePassword = '';
    try {
      profilePassword = await secureGetItem(profilePasswordKey(profile.id), 'hasła profilu');
    } catch (error) {
      setProfileLoginLoadingProfile(null);
      setLoading(false);
      updateLoginPhase('');
      Alert.alert('Profil wymaga ponownego logowania', error.message || 'Nie udało się odczytać zapisanego hasła.');
      return;
    }

    if (!profilePassword && profile.login.trim().toLowerCase() === email.trim().toLowerCase()) {
      profilePassword = await secureGetItem(PASSWORD_KEY, 'hasła aktywnego konta').catch(() => '');
    }

    if (!profilePassword) {
      setProfileLoginLoadingProfile(null);
      setLoading(false);
      updateLoginPhase('');
      Alert.alert('Profil wymaga ponownego logowania', 'Nie znaleziono zapisanego hasła dla tego profilu.');
      return;
    }

    setEmail(profile.login);
    setPassword(profilePassword);
    setSchool(profile.school);

    const cachedPlan = await readPlanCache(profile.school, profile.login);
    const hasCachedPlan = Boolean(cachedPlan?.events?.length);

    if (hasCachedPlan) {
      eventsRef.current = cachedPlan.events;
      setEvents(cachedPlan.events);
      if (cachedPlan.lastSync) setLastSync(new Date(cachedPlan.lastSync));
    }

    loadStudentProfileForAccount(profile.school, profile.login).catch(() => {});

    if (hasCachedPlan) {
      setSaved(true);
      setProfileLoginLoadingProfile(null);
      setLoading(false);
      updateLoginPhase('');
    } else {
      const synced = await syncSemester({
        forceStart: true,
        nextEmail: profile.login,
        nextPassword: profilePassword,
        notifyChanges: false,
        showErrors: true,
        showLoader: true
      });
      if (!synced) {
        setProfileLoginLoadingProfile(null);
        setLoading(false);
        updateLoginPhase('');
        return;
      }
      skipImmediateSyncRef.current = true;
      setSaved(true);
    }

    try {
      await Promise.all([
        secureSetItem(EMAIL_KEY, profile.login, 'loginu'),
        secureSetItem(PASSWORD_KEY, profilePassword, 'hasła'),
        secureSetItem(profilePasswordKey(profile.id), profilePassword, 'hasła profilu'),
        AsyncStorage.setItem(SCHOOL_KEY, profile.school)
      ]);
    } catch (error) {
      Alert.alert('Zalogowano', error.message || 'Nie udało się zapisać aktywnego profilu, ale plan jest już dostępny.');
    } finally {
      setProfileLoginLoadingProfile(null);
      setLoading(false);
      updateLoginPhase('');
    }
  }

  function resetSessionUi({ clearEmail = false } = {}) {
    syncInProgressRef.current = false;
    setSettingsOpen(false);
    setLoading(false);
    setSyncing(false);
    updateLoginPhase('');
    setSaved(false);
    setPassword('');
    if (clearEmail) {
      setEmail('');
      setSavedProfiles([]);
    }
    setEvents([]);
    setLastSync(null);
    setMode('today');
    setAnchorDate(new Date());
    setStudentProfile(createEmptyStudentProfile());
  }

  async function clearCredentials() {
    Promise.all([
      secureDeleteItem(EMAIL_KEY, 'loginu').catch(() => {}),
      secureDeleteItem(PASSWORD_KEY, 'hasła').catch(() => {}),
      AsyncStorage.removeItem(SCHOOL_KEY)
    ]);
    resetSessionUi();
  }

  function confirmWipeAllLocalData() {
    Alert.alert(
      'Usuń wszystkie dane',
      'Usuniemy z tego telefonu loginy, hasła, zapamiętane profile, plan zajęć i sesje uczelni. Tej operacji nie da się cofnąć. Konto na stronie uczelni pozostanie bez zmian.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            wipeAllData().catch((error) => {
              Alert.alert('Nie udało się usunąć danych', error.message || 'Spróbuj ponownie.');
            });
          }
        }
      ]
    );
  }

  async function wipeAllData() {
    await wipeAllLocalUserData({
      emailKey: EMAIL_KEY,
      passwordKey: PASSWORD_KEY,
      profilePasswordKey,
      readSavedProfiles,
      secureDeleteItem
    });
    resetSessionUi({ clearEmail: true });
  }

  async function toggleTheme() {
    const nextTheme = themeName === 'dark' ? 'light' : 'dark';
    setThemeName(nextTheme);
    await AsyncStorage.setItem(THEME_KEY, nextTheme);
  }

  function moveRange(direction) {
    const next = new Date(anchorDate);
    if (mode === 'today') next.setDate(next.getDate() + direction);
    if (mode === 'month') next.setMonth(next.getMonth() + direction);
    setAnchorDate(next);
  }

  function goToToday() {
    setMode('today');
    setAnchorDate(new Date());
  }

  function goToTomorrow() {
    setMode('today');
    setAnchorDate(addDays(new Date(), 1));
  }

  function goToPlanDates() {
    const focus = nearestUpcomingEventFocus(events);
    if (!focus) return;
    setAnchorDate(focus.anchorDate);
    setMode(focus.mode);
  }

  const todayKey = toDateKey(new Date());
  const tomorrowKey = toDateKey(addDays(new Date(), 1));
  const anchorKey = toDateKey(anchorDate);
  const isTodaySelected = mode === 'today' && anchorKey === todayKey;
  const isTomorrowSelected = mode === 'today' && anchorKey === tomorrowKey;

  const days = daysBetween(range.start, range.end);
  const showBlackboardPortal = school === SCHOOL_CDV && /@edu\.cdv\.pl$/i.test(email.trim());

  return (
    <SettingsShell
      drawer={(
        <SettingsDrawer
          cardVisibility={cardVisibility}
          onLogout={clearCredentials}
          onOpenPrivacy={() => {
            setSettingsOpen(false);
            setLegalDocument('privacy');
          }}
          onOpenTerms={() => {
            setSettingsOpen(false);
            setLegalDocument('terms');
          }}
          onWipeAllData={confirmWipeAllLocalData}
          onOpenBlackboardPortal={openBlackboardPortal}
          onOpenUniversityPortal={openUniversityPortal}
          onToggleCardVisibility={toggleCardVisibility}
          onToggleTheme={toggleTheme}
          showBlackboardPortal={showBlackboardPortal}
          studentProfile={studentProfile}
          theme={theme}
          themeName={themeName}
        />
      )}
      drawerBackgroundColor={theme.screenBg}
      edgeSwipeEnabled={saved}
      onClose={() => setSettingsOpen(false)}
      onOpen={() => setSettingsOpen(true)}
      open={settingsOpen}
    >
      <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0d0618', '#2a1258', '#7a00df', '#0d0618']}
        end={{ x: 1, y: 0 }}
        locations={[0, 0.24, 0.48, 1]}
        start={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <Image source={APP_ICON} style={styles.headerLogo} resizeMode="contain" />
            <AnimatedHeaderTitle isTomorrow={saved && isTomorrowSelected} styles={styles} />
          </View>
          {saved ? (
            <Pressable
              accessibilityLabel={monthSliderOpen ? 'Zwiń wybór miesiąca' : 'Rozwiń wybór miesiąca'}
              hitSlop={8}
              onPress={() => setMonthSliderOpen((open) => !open)}
              style={styles.headerMonthToggle}
            >
              <Ionicons color="#ffffff" name={monthSliderOpen ? 'chevron-up' : 'chevron-down'} size={24} />
            </Pressable>
          ) : null}
          {saved ? (
            <Pressable accessibilityLabel="Ustawienia" hitSlop={8} style={styles.settingsButton} onPress={() => setSettingsOpen(true)}>
              <Ionicons color="#ffffff" name="person-outline" size={28} />
            </Pressable>
          ) : null}
        </View>
      </LinearGradient>

      {saved ? (
        <View style={styles.scheduleScreen}>
          <View style={styles.scheduleControls}>
            <View style={styles.toolbar}>
              <View style={styles.toolbarRange}>
                {monthSliderOpen ? (
                  <MonthSlider
                    anchorDate={anchorDate}
                    items={monthSliderItems}
                    onSelectMonth={selectMonth}
                    open={monthSliderOpen}
                    styles={styles}
                  />
                ) : null}

                <ToolbarRangeTitle
                  styles={styles}
                  text={range.title}
                />

                <View style={styles.quickDayRow}>
                  <Pressable
                    accessibilityLabel="Poprzedni"
                    onPress={() => moveRange(-1)}
                    style={styles.navArrowSlot}
                  >
                    <Ionicons color={theme.mutedText} name="chevron-back" size={24} />
                  </Pressable>
                  <View style={styles.quickDayCenter}>
                    <BrandPillButton
                      active={isTodaySelected}
                      activeTextStyle={styles.quickDayButtonTextActive}
                      label="Dziś"
                      onPress={goToToday}
                      style={styles.quickDayButton}
                      textStyle={styles.quickDayButtonText}
                    />
                    <BrandPillButton
                      active={isTomorrowSelected}
                      activeTextStyle={styles.quickDayButtonTextActive}
                      label="Jutro"
                      onPress={goToTomorrow}
                      style={styles.quickDayButton}
                      textStyle={styles.quickDayButtonText}
                    />
                  </View>
                  <Pressable
                    accessibilityLabel="Następny"
                    onPress={() => moveRange(1)}
                    style={styles.navArrowSlot}
                  >
                    <Ionicons color={theme.mutedText} name="chevron-forward" size={24} />
                  </Pressable>
                </View>
              </View>
            </View>

            {lastSync ? (
              <Text style={styles.syncText}>
                Dane zapisane: {new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' }).format(lastSync)}
                {syncing ? ' • aktualizuję w tle' : ''}
              </Text>
            ) : null}
          </View>

          <ScrollView
            key={`schedule-${events.length}-${lastSync ? lastSync.getTime() : 0}`}
            style={styles.scheduleList}
            contentContainerStyle={styles.scheduleListContent}
          >
            {loading ? (
              <View style={styles.loadingPanel}>
                <ActivityIndicator color={theme.accent} />
                <Text style={styles.loadingText}>{loginPhase || 'Pobieram plan semestru...'}</Text>
              </View>
            ) : null}

            {visibleEvents.length === 0 && !loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Brak zajęć w tym zakresie</Text>
                {events.length > 0 ? (
                  <>
                    <Text style={styles.emptyHint}>
                      Plan zawiera {events.length} terminów w innych datach.
                    </Text>
                    <BrandPillButton
                      label="Przejdź do planu"
                      onPress={goToPlanDates}
                      style={styles.emptyAction}
                      textStyle={styles.emptyActionText}
                    />
                  </>
                ) : null}
              </View>
            ) : null}

            {days.map((day) => {
              const key = toDateKey(day);
              const dayEvents = groupedEvents[key] || [];
              if (mode === 'month' && dayEvents.length === 0) return null;

              return (
                <View style={styles.daySection} key={key}>
                  <Text style={styles.dayTitle}>{dateLabel(day)}</Text>
                  {dayEvents.length === 0 ? (
                    <Text style={styles.noClasses}>Brak zajęć</Text>
                  ) : (
                    dayEvents.map((event) => (
                      <ClassCard
                        cardVisibility={cardVisibility}
                        event={event}
                        key={eventIdentity(event)}
                        styles={styles}
                      />
                    ))
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      ) : profileLoginLoadingProfile ? (
        <AppSplashScreen profile={profileLoginLoadingProfile} />
      ) : (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <>
            <View style={styles.loginPanel}>
              <Text style={styles.sectionTitle}>Logowanie do CDV</Text>
              <Text style={styles.detectedSchoolText}>
                {email.trim() && detectedSchool === SCHOOL_CDV
                  ? 'Collegium Da Vinci · Wirtualna Uczelnia (wu.cdv.pl)'
                  : 'Wyłącznie konta @edu.cdv.pl i @cdv.pl'}
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                cursorColor={theme.formFocus}
                keyboardType={loginKeyboardType}
                onBlur={() => setFocusedField(null)}
                onChangeText={updateEmail}
                onFocus={() => setFocusedField('email')}
                placeholder={profile.loginPlaceholder}
                placeholderTextColor={theme.mutedText}
                selectionColor={theme.formFocus}
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                value={email}
              />
              <View style={styles.passwordRow}>
                <TextInput
                  cursorColor={theme.formFocus}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={updatePassword}
                  onFocus={() => setFocusedField('password')}
                  placeholder="Hasło"
                  placeholderTextColor={theme.mutedText}
                  secureTextEntry={!passwordVisible}
                  selectionColor={theme.formFocus}
                  style={[styles.input, styles.passwordInput, focusedField === 'password' && styles.inputFocused]}
                  value={password}
                />
                <Pressable
                  accessibilityLabel={passwordVisible ? 'Ukryj hasło' : 'Pokaż hasło'}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.passwordToggle}
                >
                  <Ionicons color={theme.passwordIcon} name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={22} />
                </Pressable>
              </View>
              <Pressable style={styles.rememberRow} onPress={() => setRememberProfile((value) => !value)}>
                {({ pressed }) => (
                  <>
                    <View style={[styles.checkbox, rememberProfile && styles.checkboxActive, pressed && styles.checkboxPressed]}>
                      {rememberProfile ? <Ionicons color={theme.checkboxCheck} name="checkmark" size={15} /> : null}
                    </View>
                    <Text style={styles.rememberText}>Zapamiętaj profil</Text>
                  </>
                )}
              </Pressable>
              <View style={styles.primaryButtonRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={loading}
                  onPress={() => {
                    void saveCredentialsAndRefresh();
                  }}
                  style={[styles.primaryButton, styles.primaryButtonFlex, loading && styles.primaryButtonDisabled]}
                >
                  <LinearGradient
                    colors={BRAND_GRADIENT}
                    end={BRAND_GRADIENT_END}
                    pointerEvents="none"
                    start={BRAND_GRADIENT_START}
                    style={styles.primaryButtonGradient}
                  >
                    {loading ? (
                      <View style={styles.primaryButtonLoading}>
                        <ActivityIndicator color={theme.text} />
                        <Text style={styles.primaryButtonLoadingText}>{loginPhase || 'Logowanie...'}</Text>
                      </View>
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Zaloguj
                      </Text>
                    )}
                  </LinearGradient>
                </Pressable>
                {loading ? (
                  <Pressable
                    accessibilityLabel="Anuluj logowanie"
                    hitSlop={8}
                    onPress={cancelActiveLogin}
                    style={({ pressed }) => [styles.loginCancelButton, pressed && styles.loginCancelButtonPressed]}
                  >
                    <Ionicons color={theme.text} name="close" size={24} />
                  </Pressable>
                ) : null}
              </View>
              {loginPhase ? <Text style={styles.loginPhaseText}>{loginPhase}</Text> : null}
              {savedProfiles.length ? (
                <View style={styles.savedProfiles}>
                  <Text style={styles.savedProfilesTitle}>Zapamiętane konta</Text>
                  {savedProfiles.map((savedProfile) => (
                    <SavedProfileButton
                      key={savedProfile.id}
                      loading={loading}
                      onPress={() => loginWithProfile(savedProfile)}
                      onRemove={() => confirmDeleteSavedProfile(savedProfile)}
                      savedProfile={savedProfile}
                      styles={styles}
                      theme={theme}
                    />
                  ))}
                </View>
              ) : null}
            </View>
            <LegalLinks
              onOpenDeletion={() => setLegalDocument('deletion')}
              onOpenPrivacy={() => setLegalDocument('privacy')}
              onOpenTerms={() => setLegalDocument('terms')}
              theme={theme}
            />
            <StudioBrandFooter styles={styles} />
          </>
        </ScrollView>
      )}
      <Image
        pointerEvents="none"
        resizeMode="contain"
        source={CDV_LOGO}
        style={styles.cdvWatermark}
      />
    </SafeAreaView>
      <LegalDocumentModal
        documentKey={legalDocument}
        onClose={() => setLegalDocument(null)}
        theme={theme}
        visible={Boolean(legalDocument)}
      />
      <DeleteSavedProfileModal
        login={deleteProfileConfirm?.login}
        onCancel={() => setDeleteProfileConfirm(null)}
        onConfirm={handleConfirmDeleteSavedProfile}
        theme={theme}
        visible={Boolean(deleteProfileConfirm)}
      />
      <UniversityPortalModal
        autoLogin={portalWebView?.autoLogin}
        cookies={portalWebView?.cookies}
        loading={Boolean(portalWebView?.loading)}
        onClose={() => setPortalWebView(null)}
        theme={theme}
        title={portalWebView?.title}
        url={portalWebView?.url}
        visible={Boolean(portalWebView)}
      />
    </SettingsShell>
  );
}

function DeleteSavedProfileModal({ login, onCancel, onConfirm, theme, visible }) {
  const modalStyles = useMemo(() => createConfirmModalStyles(theme), [theme]);

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={modalStyles.scrim}>
        <View style={modalStyles.panel}>
          <View style={modalStyles.header}>
            <LinearGradient
              colors={BRAND_GRADIENT}
              end={BRAND_GRADIENT_END}
              start={BRAND_GRADIENT_START}
              style={modalStyles.iconWrap}
            >
              <Ionicons color={BRAND_GRADIENT_TEXT} name="person-remove-outline" size={22} />
            </LinearGradient>
            <View style={modalStyles.titleBlock}>
              <Text style={modalStyles.title}>Usuń konto</Text>
              {login ? <Text style={modalStyles.subtitle}>{login}</Text> : null}
            </View>
          </View>

          <Text style={modalStyles.confirmText}>
            Czy na pewno chcesz usunąć to konto z listy zapamiętanych kont?
          </Text>

          <View style={modalStyles.footer}>
            <Pressable onPress={onCancel} style={modalStyles.secondaryButton}>
              <Text style={modalStyles.secondaryButtonText}>Nie</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={modalStyles.primaryButton}>
              <LinearGradient
                colors={BRAND_GRADIENT}
                end={BRAND_GRADIENT_END}
                start={BRAND_GRADIENT_START}
                style={modalStyles.primaryGradient}
              >
                <Text style={modalStyles.primaryText}>Tak</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UniversityPortalModal({ autoLogin, cookies, loading, onClose, theme, title = 'Twoja Uczelnia', url, visible }) {
  const modalStyles = useMemo(() => createUniversityPortalStyles(theme), [theme]);
  const source = useMemo(() => {
    const cookieHeader = buildCookieHeader(cookies);
    return {
      uri: url,
      ...(cookieHeader ? { headers: { Cookie: cookieHeader } } : {})
    };
  }, [cookies, url]);
  const autoLoginScript = useMemo(() => {
    if (autoLogin?.school !== SCHOOL_CDV || !autoLogin.email || !autoLogin.password) return '';

    return `
      (function () {
        var email = ${JSON.stringify(autoLogin.email)};
        var password = ${JSON.stringify(autoLogin.password)};
        var target = ${JSON.stringify(autoLogin.target || 'wu')};
        var blackboardUrl = ${JSON.stringify(buildCdvBlackboardUrl(autoLogin.email))};
        var host = String(window.location.hostname || '').toLowerCase();

        function setValue(input, value) {
          if (!input) return;
          var descriptor = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value');
          if (descriptor && descriptor.set) {
            descriptor.set.call(input, value);
          } else {
            input.value = value;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function clickOrSubmit(input) {
          var submit = document.querySelector('#idSIButton9, input[type="submit"], button[type="submit"], button');
          if (submit && !submit.disabled) {
            submit.click();
            return true;
          }
          var form = input && input.form ? input.form : document.querySelector('form');
          if (form) {
            form.submit();
            return true;
          }
          return false;
        }

        function runWuLogin() {
          if (!/wu\\.cdv\\.pl$/i.test(host)) return true;
          var loginInput = document.querySelector('input[name="login"]');
          var passwordInput = document.querySelector('input[name="password"]');
          if (!loginInput || !passwordInput || window.__comamdzisCdvAutoLoginDone) return true;
          window.__comamdzisCdvAutoLoginDone = true;
          setValue(loginInput, email);
          setValue(passwordInput, password);
          var form = passwordInput.form || loginInput.form || document.querySelector('form');
          if (form) form.submit();
          return true;
        }

        function runBlackboardLogin() {
          if (host === 'cdv.blackboard.com') {
            var provider = document.querySelector('a[href*="/auth-saml/saml/login"], #loginRedirectProviderList a');
            if (provider && !window.__comamdzisBlackboardProviderClicked) {
              window.__comamdzisBlackboardProviderClicked = true;
              provider.click();
              return true;
            }
            return false;
          }

          if (!/login\\.microsoftonline\\.com$/i.test(host)) return false;

          var pageText = String(document.body && document.body.innerText || '');
          if (/AADSTS90100/i.test(pageText) && !window.__comamdzisMicrosoftLoginHintRetry) {
            window.__comamdzisMicrosoftLoginHintRetry = true;
            window.location.href = blackboardUrl;
            return true;
          }

          var emailInput = document.querySelector('input[type="email"], input[name="loginfmt"], #i0116');
          if (emailInput && emailInput.offsetParent !== null) {
            setValue(emailInput, email);
            if (String(emailInput.value || '').trim().toLowerCase() !== String(email || '').trim().toLowerCase()) return false;
            if (window.__comamdzisMicrosoftEmailDone) return true;
            window.__comamdzisMicrosoftEmailDone = true;
            clickOrSubmit(emailInput);
            return true;
          }

          var passwordInput = document.querySelector('input[type="password"], input[name="passwd"], #i0118');
          if (passwordInput && passwordInput.offsetParent !== null) {
            setValue(passwordInput, password);
            if (!String(passwordInput.value || '').length) return false;
            if (window.__comamdzisMicrosoftPasswordDone) return true;
            window.__comamdzisMicrosoftPasswordDone = true;
            clickOrSubmit(passwordInput);
            return true;
          }

          var keepSignedIn = document.querySelector('#KmsiDescription, input[name="DontShowAgain"]');
          if (keepSignedIn && !window.__comamdzisMicrosoftKmsiDone) {
            window.__comamdzisMicrosoftKmsiDone = true;
            var yesButton = document.querySelector('#idSIButton9');
            if (yesButton) yesButton.click();
            return true;
          }

          return false;
        }

        try {
          if (target === 'blackboard') {
            var attempts = 0;
            var timer = setInterval(function () {
              attempts += 1;
              try {
                runBlackboardLogin();
              } catch (error) {}
              if (attempts >= 40) clearInterval(timer);
            }, 500);
            runBlackboardLogin();
          } else {
            runWuLogin();
          }
        } catch (error) {}
        return true;
      })();
      true;
    `;
  }, [autoLogin]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView style={modalStyles.safeArea}>
        <View style={modalStyles.toolbar}>
          <Pressable accessibilityLabel="Zamknij" hitSlop={8} onPress={onClose} style={modalStyles.closeButton}>
            <Ionicons color={theme.text} name="close" size={28} />
          </Pressable>
          <Text numberOfLines={1} style={modalStyles.toolbarTitle}>{title}</Text>
        </View>
        {loading ? (
          <View style={modalStyles.loadingWrap}>
            <ActivityIndicator color={theme.accent} size="large" />
          </View>
        ) : url ? (
          <WebView
            injectedJavaScriptBeforeContentLoaded={autoLoginScript}
            injectedJavaScript={autoLoginScript}
            originWhitelist={['*']}
            sharedCookiesEnabled
            source={source}
            startInLoadingState
            style={modalStyles.webView}
            thirdPartyCookiesEnabled
          />
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const TEXT_MASK_DESCENDER_SLACK = 14;

function BrandGradientSurface({ children, compact = false, style, textMask = false }) {
  const [size, setSize] = useState(null);
  const layoutStyle = textMask
    ? [style, compact ? stylesTextMaskBleedCompact : stylesTextMaskBleed]
    : style;
  const descenderSlack = textMask && !compact ? TEXT_MASK_DESCENDER_SLACK : 0;
  const renderHeight = size ? size.height + descenderSlack : 0;

  if (!size) {
    return (
      <View
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize({ width: Math.ceil(width), height: Math.ceil(height) });
        }}
        style={[layoutStyle, stylesMeasureHidden]}
      >
        {children}
      </View>
    );
  }

  const maskedView = (
    <MaskedView
      maskElement={
        <View
          style={[
            layoutStyle,
            stylesMaskRoot,
            textMask && !compact && { height: renderHeight, justifyContent: 'flex-start' }
          ]}
        >
          {children}
        </View>
      }
      style={{ height: renderHeight, overflow: 'visible', width: size.width }}
    >
      <LinearGradient
        colors={BRAND_GRADIENT}
        end={BRAND_GRADIENT_END}
        start={BRAND_GRADIENT_START}
        style={{ height: renderHeight, width: size.width }}
      />
    </MaskedView>
  );

  if (!textMask || compact) return maskedView;

  return <View style={stylesTextMaskOuter}>{maskedView}</View>;
}

function createStudioBrandStyles(footerStyle = {}) {
  return {
    studioFooter: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 'auto',
      paddingTop: 28,
      ...footerStyle
    },
    studioBrandWrap: {
      opacity: 0.3
    },
    studioBrandRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6
    },
    studioVersion: {
      color: '#64748b',
      fontFamily: FONT.bodyBold,
      fontSize: 11,
      includeFontPadding: false,
      lineHeight: 16,
      marginRight: 4
    },
    studioLogoWrap: {
      height: 18,
      justifyContent: 'center',
      width: 38
    },
    studioLogo: {
      height: 18,
      width: 38
    },
    studioTextWrap: {
      height: 20,
      justifyContent: 'center',
      paddingRight: 2,
      width: 54
    },
    studioTextMask: {
      color: '#000000',
      fontFamily: FONT.title,
      fontSize: 13,
      includeFontPadding: false,
      lineHeight: 20
    }
  };
}

function StudioBrandFooter({ inline = false, styles }) {
  const brand = (
    <View style={styles.studioBrandWrap}>
      <View style={styles.studioBrandRow}>
        <Text style={styles.studioVersion}>v{APP_VERSION}</Text>
        <BrandGradientSurface style={styles.studioLogoWrap}>
          <Image resizeMode="contain" source={APP_ICON} style={styles.studioLogo} />
        </BrandGradientSurface>
        <BrandGradientSurface style={styles.studioTextWrap}>
          <Text style={styles.studioTextMask}>studios</Text>
        </BrandGradientSurface>
      </View>
    </View>
  );

  if (inline) return brand;

  return (
    <View style={styles.studioFooter}>
      {brand}
    </View>
  );
}

const stylesMeasureHidden = {
  opacity: 0
};

const stylesMaskRoot = {
  backgroundColor: 'transparent'
};

const stylesTextMaskBleed = {
  overflow: 'visible',
  paddingBottom: 12,
  paddingTop: 4
};

const stylesTextMaskBleedCompact = {
  overflow: 'visible',
  paddingBottom: 0,
  paddingTop: 0
};

const stylesTextMaskOuter = {
  alignSelf: 'center',
  overflow: 'visible'
};

const HEADER_TITLE_WORD_HEIGHT = 30;
const HEADER_TITLE_WORD_DROP_MS = Math.round(520 * 1.15);

function AnimatedHeaderTitle({ isTomorrow, styles }) {
  const target = isTomorrow ? 'jutro' : 'dziś';
  const progress = useRef(new Animated.Value(0)).current;
  const skipFirst = useRef(true);
  const stackRef = useRef({ from: target, to: target });
  const [stack, setStack] = useState({ from: target, to: target });
  const outgoingY = useMemo(() => progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, HEADER_TITLE_WORD_HEIGHT]
  }), [progress]);
  const incomingY = useMemo(() => progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-HEADER_TITLE_WORD_HEIGHT, 0]
  }), [progress]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      stackRef.current = { from: target, to: target };
      return undefined;
    }

    const from = stackRef.current.to;
    if (from === target) return undefined;

    stackRef.current = { from, to: target };
    setStack({ from, to: target });
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      duration: HEADER_TITLE_WORD_DROP_MS,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      toValue: 1,
      useNativeDriver: true
    });
    animation.start(({ finished }) => {
      if (!finished) return;
      stackRef.current = { from: target, to: target };
      setStack({ from: target, to: target });
    });

    return () => animation.stop();
  }, [progress, target]);

  const dropping = stack.from !== stack.to;

  return (
    <View
      accessible
      accessibilityLabel={`cdv${target}`}
      accessibilityRole="header"
      style={styles.headerTitleRow}
    >
      <Text style={styles.headerTitle}>cdv</Text>
      <View style={styles.headerTitleWordSlot}>
        <Text style={[styles.headerTitle, styles.headerTitleWordSizer]}>jutro</Text>
        {dropping ? (
          <>
            <Animated.View style={[styles.headerTitleWordLayer, { transform: [{ translateY: outgoingY }] }]}>
              <Text style={styles.headerTitle}>{stack.from}</Text>
            </Animated.View>
            <Animated.View style={[styles.headerTitleWordLayer, { transform: [{ translateY: incomingY }] }]}>
              <Text style={styles.headerTitle}>{stack.to}</Text>
            </Animated.View>
          </>
        ) : (
          <View style={styles.headerTitleWordLayer}>
            <Text style={styles.headerTitle}>{stack.to}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SettingsShell({ children, drawer, drawerBackgroundColor, edgeSwipeEnabled = false, onClose, onOpen, open }) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const draggingRef = useRef(false);
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = screenWidth * SETTINGS_DRAWER_RATIO;
  const peekWidth = screenWidth - drawerWidth;

  const animateProgress = useCallback((toValue) => {
    Animated.timing(progress, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
      toValue,
      useNativeDriver: true
    }).start();
  }, [progress]);

  useEffect(() => {
    if (draggingRef.current) return;
    animateProgress(open ? 1 : 0);
  }, [animateProgress, open]);

  const finishOpenDrag = useCallback((gestureState) => {
    draggingRef.current = false;
    progress.stopAnimation((current) => {
      const shouldOpen = current >= SETTINGS_DRAG_OPEN_THRESHOLD || gestureState.vx < -0.35;
      if (shouldOpen) {
        onOpen?.();
        animateProgress(1);
        return;
      }
      animateProgress(0);
    });
  }, [animateProgress, onOpen, progress]);

  const finishCloseDrag = useCallback((gestureState) => {
    draggingRef.current = false;
    progress.stopAnimation((current) => {
      const shouldClose = current <= 1 - SETTINGS_DRAG_OPEN_THRESHOLD || gestureState.vx > 0.35;
      if (shouldClose) {
        onClose?.();
        animateProgress(0);
        return;
      }
      animateProgress(1);
    });
  }, [animateProgress, onClose, progress]);

  const edgePanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        && gestureState.dx < -6
      ),
      onPanResponderGrant: () => {
        draggingRef.current = true;
        progress.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const next = Math.min(1, Math.max(0, -gestureState.dx / drawerWidth));
        progress.setValue(next);
      },
      onPanResponderRelease: (_, gestureState) => finishOpenDrag(gestureState),
      onPanResponderTerminate: (_, gestureState) => finishOpenDrag(gestureState),
      onStartShouldSetPanResponder: () => false
    }),
    [drawerWidth, finishOpenDrag, progress]
  );

  const peekPanResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        && gestureState.dx > 6
      ),
      onPanResponderGrant: () => {
        draggingRef.current = true;
        progress.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        const next = Math.min(1, Math.max(0, 1 - gestureState.dx / drawerWidth));
        progress.setValue(next);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          draggingRef.current = false;
          onClose?.();
          animateProgress(0);
          return;
        }
        finishCloseDrag(gestureState);
      },
      onPanResponderTerminate: (_, gestureState) => finishCloseDrag(gestureState),
      onStartShouldSetPanResponder: () => true
    }),
    [animateProgress, drawerWidth, finishCloseDrag, onClose, progress]
  );

  const contentTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -drawerWidth]
  });

  const contentOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SETTINGS_CONTENT_SCRIM_OPACITY]
  });
  const contentScrimOpacity = contentOpacity;

  const drawerTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [drawerWidth, 0]
  });

  return (
    <View style={settingsShellStyles.root}>
      <Animated.View
        style={[
          settingsShellStyles.content,
          {
            width: screenWidth,
            transform: [{ translateX: contentTranslateX }]
          }
        ]}
      >
        {children}
        <Animated.View
          pointerEvents="none"
          style={[settingsShellStyles.contentScrim, { opacity: contentScrimOpacity }]}
        />
      </Animated.View>

      {open ? (
        <View
          accessibilityLabel="Zamknij ustawienia"
          accessibilityRole="button"
          {...peekPanResponder.panHandlers}
          style={[settingsShellStyles.peekOverlay, { width: peekWidth }]}
        />
      ) : null}

      {!open && edgeSwipeEnabled ? (
        <View
          {...edgePanResponder.panHandlers}
          style={[settingsShellStyles.edgeSwipeZone, { width: SETTINGS_EDGE_SWIPE_WIDTH }]}
        />
      ) : null}

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          settingsShellStyles.drawer,
          {
            backgroundColor: drawerBackgroundColor,
            maxWidth: drawerWidth,
            transform: [{ translateX: drawerTranslateX }],
            width: drawerWidth
          }
        ]}
      >
        <View
          style={[
            settingsShellStyles.drawerSafeArea,
            { paddingBottom: insets.bottom, paddingTop: insets.top }
          ]}
        >
          {drawer}
        </View>
      </Animated.View>
    </View>
  );
}

function SettingsDrawerLogo({ styles }) {
  return (
    <View style={styles.drawerBrandWrap}>
      <View style={styles.drawerLogoWrap}>
        <Image resizeMode="contain" source={APP_ICON} style={styles.drawerLogo} />
      </View>
      <BrandGradientSurface style={styles.drawerBrandTextWrap} textMask>
        <Text style={styles.drawerBrandTextMask}>cdv dziś</Text>
      </BrandGradientSurface>
    </View>
  );
}

function SettingsToggle({ onValueChange, styles, value }) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      duration: THEME_TRANSITION_MS,
      easing: THEME_TRANSITION_EASING,
      toValue: value ? 1 : 0,
      useNativeDriver: true
    }).start();
  }, [progress, value]);

  const thumbTranslateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SETTINGS_TOGGLE_TRAVEL]
  });
  const gradientOpacity = progress;
  const thumbGrayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });
  const thumbWhiteOpacity = progress;

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
    >
      <View style={styles.toggleTrack}>
        <Animated.View pointerEvents="none" style={[styles.toggleGradient, { opacity: gradientOpacity }]}>
          <LinearGradient
            colors={BRAND_GRADIENT}
            end={BRAND_GRADIENT_END}
            start={BRAND_GRADIENT_START}
            style={styles.toggleGradientFill}
          />
        </Animated.View>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: thumbTranslateX }] }]}>
          <Animated.View style={[styles.toggleThumbLayer, styles.toggleThumbGray, { opacity: thumbGrayOpacity }]} />
          <Animated.View style={[styles.toggleThumbLayer, styles.toggleThumbWhite, { opacity: thumbWhiteOpacity }]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

function SettingsMenuRow({ icon, iconColor, label, onPress, styles, trailing }) {
  const row = (
    <View style={styles.menuRow}>
      <Ionicons color={iconColor} name={icon} size={24} style={styles.menuIcon} />
      <Text ellipsizeMode="tail" numberOfLines={1} style={styles.menuLabel}>
        {label}
      </Text>
      {trailing ? <View style={styles.menuTrailing}>{trailing}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRowPressable, pressed && styles.menuRowPressed]}>
        {row}
      </Pressable>
    );
  }

  return row;
}

function SettingsDrawer({
  cardVisibility,
  onLogout,
  onOpenBlackboardPortal,
  onOpenPrivacy,
  onOpenTerms,
  onOpenUniversityPortal,
  onToggleCardVisibility,
  onToggleTheme,
  onWipeAllData,
  showBlackboardPortal,
  studentProfile,
  theme,
  themeName
}) {
  const darkMode = themeName === 'dark';
  const drawerStyles = useMemo(() => createSettingsDrawerStyles(theme), [theme]);

  return (
    <View style={drawerStyles.safeArea}>
      <ScrollView
        contentContainerStyle={drawerStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={drawerStyles.scrollView}
      >
        <View style={drawerStyles.drawerMain}>
          <View style={drawerStyles.brandZone}>
            <SettingsDrawerLogo styles={drawerStyles} />
          </View>

          <View style={drawerStyles.menuBlock}>
        <StudentDataSection
          profile={studentProfile}
          styles={drawerStyles}
          theme={theme}
        />

        <Text style={drawerStyles.sectionTitle}>Ustawienia</Text>
        <SettingsMenuRow
          icon={darkMode ? 'sunny-outline' : 'moon-outline'}
          iconColor={theme.text}
          label="Motyw"
          styles={drawerStyles}
          trailing={(
            <SettingsToggle onValueChange={onToggleTheme} styles={drawerStyles} value={darkMode} />
          )}
        />

        <Text style={drawerStyles.sectionTitle}>Informacje dodatkowe</Text>
        {CARD_VISIBILITY_FIELDS.map((field) => (
          <SettingsMenuRow
            icon={field.icon}
            iconColor={theme.text}
            key={field.key}
            label={field.label}
            styles={drawerStyles}
            trailing={(
              <SettingsToggle
                onValueChange={() => onToggleCardVisibility(field.key)}
                styles={drawerStyles}
                value={cardVisibility[field.key]}
              />
            )}
          />
        ))}

        <Text style={drawerStyles.sectionTitle}>UCZELNIA</Text>
        <SettingsMenuRow
          icon="globe-outline"
          iconColor={theme.text}
          label="Twoja Uczelnia"
          onPress={onOpenUniversityPortal}
          styles={drawerStyles}
          trailing={<Ionicons color={theme.mutedText} name="open-outline" size={20} />}
        />
        {showBlackboardPortal ? (
          <SettingsMenuRow
            icon="school-outline"
            iconColor={theme.text}
            label="Blackboard"
            onPress={onOpenBlackboardPortal}
            styles={drawerStyles}
            trailing={<Ionicons color={theme.mutedText} name="open-outline" size={20} />}
          />
        ) : null}

        <Text style={drawerStyles.sectionTitle}>Prawne i dane</Text>
        <SettingsMenuRow
          icon="shield-checkmark-outline"
          iconColor={theme.text}
          label="Polityka prywatności"
          onPress={onOpenPrivacy}
          styles={drawerStyles}
          trailing={<Ionicons color={theme.mutedText} name="chevron-forward-outline" size={20} />}
        />
        <SettingsMenuRow
          icon="document-outline"
          iconColor={theme.text}
          label="Regulamin"
          onPress={onOpenTerms}
          styles={drawerStyles}
          trailing={<Ionicons color={theme.mutedText} name="chevron-forward-outline" size={20} />}
        />
        <SettingsMenuRow
          icon="trash-outline"
          iconColor={theme.text}
          label="Usuń wszystkie dane"
          onPress={onWipeAllData}
          styles={drawerStyles}
          trailing={<Ionicons color={theme.mutedText} name="chevron-forward-outline" size={20} />}
        />

        <View style={drawerStyles.divider} />

        <View style={drawerStyles.footerRow}>
          <StudioBrandFooter inline styles={drawerStyles} />
          <Pressable
            accessibilityLabel="Wyloguj"
            onPress={onLogout}
            style={({ pressed }) => [drawerStyles.logoutFooterPressable, pressed && drawerStyles.menuRowPressed]}
          >
            <Ionicons color={theme.text} name="log-out-outline" size={24} />
            <Text style={drawerStyles.logoutFooterLabel}>Wyloguj</Text>
          </Pressable>
        </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function normalizeClassLabel(value) {
  return String(value || '').trim().toLowerCase();
}

function isDuplicateClassLabel(a, b) {
  const left = normalizeClassLabel(a);
  const right = normalizeClassLabel(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function capitalizeClassLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildClassMetaLabel(event) {
  const parts = [];
  const statusLabel = eventStatusLabel(event);
  if (statusLabel) parts.push(statusLabel);
  if (event.isImportantDate) parts.push('Ważny termin');
  if (event.form && !isDuplicateClassLabel(event.form, 'Ważny termin')) parts.push(event.form);
  return parts.map(capitalizeClassLabel).join(' | ');
}

const COLLEGIUM_DA_VINCI_PATTERN = /collegium\s+da\s+vinci/gi;

function shortenAddressPart(value) {
  return String(value || '').replace(COLLEGIUM_DA_VINCI_PATTERN, 'CDV').trim();
}

function formatClassAddress(buildingName, buildingAddress) {
  const parts = [buildingName, buildingAddress]
    .map(shortenAddressPart)
    .filter(Boolean);
  return parts.join(', ');
}

function ClassCard({ cardVisibility = DEFAULT_CARD_VISIBILITY, event, styles }) {
  const addressLabel = formatClassAddress(event.buildingName, event.buildingAddress);
  const roomLabel = formatPlanRoomLabel(event);
  const teacherLabel = event.teacherNames?.length
    ? event.teacherNames.join(', ')
    : String(event.teacherName || event.teachers || '').trim();
  const groupLabel = String(event.groupName || event.module || '').trim();
  const subjectLabel =
    event.subject && !isDuplicateClassLabel(event.subject, event.title) && !isDuplicateClassLabel(event.subject, event.module)
      ? event.subject
      : '';
  const additionalInfo = sanitizePlanAdditionalInfo(event);
  const metaLabel = buildClassMetaLabel(event);
  const isOnline = isPlanEventOnline(event);
  const showOnlineLink = isOnline && shouldShowPlanOnlineLink(event);
  const hasOnCampusLocation =
    Boolean(event.buildingName || event.buildingAddress || roomLabel) ||
    /^budynek$/i.test(String(event.locationMode || ''));
  const locationKindLabel = isOnline ? 'Online' : hasOnCampusLocation ? 'Stacjonarnie' : '';
  const hasLocationRow = Boolean(locationKindLabel || roomLabel || showOnlineLink);
  const showAddress = cardVisibility.address && addressLabel && !isOnline;
  const showGroup =
    cardVisibility.group &&
    groupLabel &&
    !isDuplicateClassLabel(groupLabel, event.title) &&
    !isDuplicateClassLabel(groupLabel, event.subject);
  const showSubject = Boolean(subjectLabel);
  const showTeacher = cardVisibility.teacher && teacherLabel;
  const showInfo = cardVisibility.info && additionalInfo;
  const showDetails = showAddress || showGroup || showSubject || showTeacher || showInfo;
  const crossedOut = isEventCrossedOut(event);
  const crossedOutStyle = crossedOut ? styles.classTextCrossedOut : null;
  const mutedCardStyle = crossedOut ? styles.classCardMuted : null;
  const mutedStripeStyle = crossedOut ? styles.classStripeMuted : null;

  return (
    <View style={[styles.classCard, mutedCardStyle]}>
      <View style={[styles.classStripe, { backgroundColor: event.color }, mutedStripeStyle]} />
      <View style={styles.classContent}>
        {hasLocationRow ? (
          <View style={styles.classTimeRow}>
            <View style={styles.classTimeSlot}>
              <Text numberOfLines={1} style={[styles.classTime, styles.classTimeSlotText, crossedOutStyle]}>
                {eventTimeRange(event)}
              </Text>
            </View>
            <View style={styles.classTimeSlot}>
              {locationKindLabel ? (
                <Text numberOfLines={1} style={[styles.classLocationKind, styles.classTimeSlotText, crossedOutStyle]}>
                  {locationKindLabel}
                </Text>
              ) : null}
            </View>
            <View style={styles.classTimeSlot}>
              {!isOnline && roomLabel ? (
                <Text numberOfLines={1} style={[styles.classLocationDetail, styles.classTimeSlotText, crossedOutStyle]}>
                  {roomLabel}
                </Text>
              ) : null}
              {showOnlineLink ? (
                <Pressable onPress={() => Linking.openURL(event.hangoutLink)}>
                  <Text numberOfLines={1} style={[styles.classLocationLink, styles.classTimeSlotText, crossedOutStyle]}>
                    {event.hangoutLinkLabel || 'Link do zajęć'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <Text style={[styles.classTime, styles.classTimeStandalone, crossedOutStyle]}>{eventTimeRange(event)}</Text>
        )}
        <Text style={[styles.classTitle, crossedOutStyle]}>{event.title}</Text>
        {metaLabel ? (
          <View style={styles.classMetaBadge}>
            <Text style={[styles.classMeta, crossedOutStyle]}>{metaLabel}</Text>
          </View>
        ) : null}
        {showDetails ? (
          <View style={styles.detailList}>
            {showAddress ? (
              <DetailRow label="Adres" numberOfLines={1} value={addressLabel} styles={styles} />
            ) : null}
            {showGroup ? <DetailRow label="Grupa" value={groupLabel} styles={styles} /> : null}
            {showSubject ? <DetailRow label="Przedmiot" value={subjectLabel} styles={styles} /> : null}
            {showTeacher ? <DetailRow label="Prowadzący" value={teacherLabel} styles={styles} /> : null}
            {showInfo ? <DetailRow label="Info" value={additionalInfo} styles={styles} /> : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function DetailRow({ label, numberOfLines, value, accent = false, onPress, styles }) {
  const content = (
    <>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        ellipsizeMode={numberOfLines === 1 ? 'tail' : undefined}
        numberOfLines={numberOfLines}
        style={[styles.detailValue, accent && styles.detailValueAccent]}
      >
        {value}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.detailRow} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={styles.detailRow}>
      {content}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.appBg
    },
    header: {
      backgroundColor: theme.headerBg,
      overflow: 'hidden',
      paddingHorizontal: 20,
      paddingBottom: 16,
      paddingTop: 42
    },
    headerTop: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'space-between',
      maxWidth: '100%',
      width: '100%'
    },
    headerBrand: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1,
      gap: 10
    },
    headerMonthToggle: {
      alignItems: 'center',
      flexShrink: 0,
      height: 30,
      justifyContent: 'center',
      width: 30
    },
    headerLogo: {
      borderRadius: 10,
      height: 40,
      overflow: 'hidden',
      width: 40
    },
    cdvWatermark: {
      alignSelf: 'center',
      bottom: 36,
      height: 76,
      opacity: theme.name === 'dark' ? 0.2 : 0.12,
      pointerEvents: 'none',
      position: 'absolute',
      tintColor: theme.name === 'dark' ? '#ffffff' : '#2a1258',
      width: 280,
      zIndex: 2
    },
    headerTitle: {
      color: '#ffffff',
      fontFamily: FONT.title,
      fontSize: 24,
      includeFontPadding: false,
      lineHeight: 30,
      margin: 0,
      padding: 0
    },
    headerTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 1
    },
    headerTitleWordSlot: {
      height: HEADER_TITLE_WORD_HEIGHT,
      overflow: 'hidden'
    },
    headerTitleWordSizer: {
      opacity: 0
    },
    headerTitleWordLayer: {
      left: 0,
      position: 'absolute',
      top: 0
    },
    settingsButton: {
      flexShrink: 0,
      alignItems: 'center',
      height: 30,
      justifyContent: 'center',
      padding: 0,
      width: 30
    },
    screen: {
      backgroundColor: theme.screenBg
    },
    scheduleScreen: {
      backgroundColor: theme.screenBg,
      flex: 1,
      overflow: 'hidden'
    },
    scheduleControls: {
      overflow: 'hidden',
      paddingHorizontal: 16,
      paddingTop: 16
    },
    scheduleList: {
      flex: 1
    },
    scheduleListContent: {
      paddingBottom: 32,
      paddingHorizontal: 16
    },
    content: {
      flexGrow: 1,
      padding: 16,
      paddingBottom: 32
    },
    loginPanel: {
      marginTop: 18,
      paddingVertical: 4
    },
    profileLoadingScreen: {
      alignItems: 'center',
      backgroundColor: theme.appBg,
      flex: 1,
      justifyContent: 'center',
      overflow: 'hidden',
      paddingHorizontal: 28
    },
    profileLoadingLogoWrap: {
      alignItems: 'center',
      height: 76,
      justifyContent: 'center',
      marginBottom: 12,
      width: 76
    },
    profileLoadingLogo: {
      height: 64,
      width: 64
    },
    profileLoadingLogin: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 14,
      marginBottom: 18,
      textAlign: 'center'
    },
    profileLoadingDots: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 7,
      height: 18,
      justifyContent: 'center'
    },
    profileLoadingDot: {
      borderRadius: 4,
      height: 8,
      overflow: 'hidden',
      width: 8
    },
    profileLoadingDotFill: {
      flex: 1
    },
    sectionTitle: {
      color: theme.text,
      fontFamily: FONT.title,
      fontSize: 20,
      marginBottom: 14,
      textAlign: 'center'
    },
    input: {
      backgroundColor: theme.screenBg,
      borderColor: theme.formMuted,
      borderRadius: 8,
      borderWidth: 1,
      color: theme.text,
      fontFamily: FONT.body,
      fontSize: 16,
      marginBottom: 12,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: 12
    },
    inputFocused: {
      borderColor: theme.formFocus,
      borderWidth: 1.5
    },
    passwordRow: {
      position: 'relative'
    },
    passwordInput: {
      paddingRight: 48
    },
    passwordToggle: {
      alignItems: 'center',
      bottom: 14,
      height: 48,
      justifyContent: 'center',
      position: 'absolute',
      right: 2,
      width: 44
    },
    rememberRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12
    },
    checkbox: {
      alignItems: 'center',
      borderColor: theme.formMuted,
      borderRadius: 5,
      borderWidth: 1,
      height: 22,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 22
    },
    checkboxActive: {
      backgroundColor: theme.formMuted,
      borderColor: theme.formMuted
    },
    checkboxPressed: {
      borderColor: theme.formFocus
    },
    rememberText: {
      color: theme.rememberText,
      fontFamily: FONT.body,
      fontSize: 14
    },
    detectedSchoolText: {
      color: theme.mutedText,
      fontFamily: FONT.bodyBold,
      fontSize: 13,
      marginBottom: 8
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: theme.formFocus,
      borderRadius: 24,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      marginTop: 4
    },
    secondaryButtonText: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 14
    },
    primaryButton: {
      borderRadius: 24,
      height: 48,
      minHeight: 48,
      overflow: 'hidden'
    },
    primaryButtonRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      marginTop: 12
    },
    primaryButtonFlex: {
      flex: 1,
      marginTop: 0
    },
    loginCancelButton: {
      alignItems: 'center',
      backgroundColor: theme.screenBg,
      borderColor: theme.formMuted,
      borderRadius: 24,
      borderWidth: 1,
      height: 48,
      justifyContent: 'center',
      width: 48
    },
    loginCancelButtonPressed: {
      opacity: 0.75
    },
    primaryButtonDisabled: {
      opacity: 0.75
    },
    primaryButtonGradient: {
      alignItems: 'center',
      flex: 1,
      height: 48,
      justifyContent: 'center',
      minHeight: 48
    },
    primaryButtonText: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 16
    },
    primaryButtonLoading: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'center',
      paddingHorizontal: 14
    },
    primaryButtonLoadingText: {
      color: theme.text,
      flexShrink: 1,
      fontFamily: FONT.bodyBold,
      fontSize: 13,
      textAlign: 'center'
    },
    loginPhaseText: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 12,
      marginTop: 8
    },
    savedProfiles: {
      borderTopColor: theme.divider,
      borderTopWidth: 1,
      gap: 8,
      marginTop: 16,
      paddingTop: 14
    },
    savedProfilesTitle: {
      color: theme.mutedText,
      fontFamily: FONT.bodyBold,
      fontSize: 12,
      textTransform: 'uppercase'
    },
    profileButton: {
      alignItems: 'center',
      backgroundColor: theme.screenBg,
      borderColor: theme.formMuted,
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 4,
      minHeight: 48,
      paddingLeft: 14,
      paddingRight: 2,
      paddingVertical: 12
    },
    profileButtonMain: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: 12,
      minWidth: 0
    },
    profileButtonPressed: {
      opacity: 0.72
    },
    profileRemoveButton: {
      alignItems: 'center',
      borderRadius: 999,
      flexShrink: 0,
      height: 32,
      justifyContent: 'center',
      width: 44
    },
    profileLogoBox: {
      alignItems: 'center',
      borderRadius: 7,
      flexShrink: 0,
      height: 44,
      justifyContent: 'center',
      overflow: 'hidden',
      width: 112
    },
    profileLogoBoxDark: {
      backgroundColor: '#050505',
      paddingHorizontal: 8
    },
    profileSchoolLogo: {
      height: 34,
      maxHeight: 34,
      maxWidth: 104,
      width: 104
    },
    profileTextBlock: {
      flex: 1
    },
    profileLogin: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 14
    },
    profileSchool: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 12,
      marginTop: 2
    },
    ...createStudioBrandStyles(),
    toolbar: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 14
    },
    toolbarRange: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden'
    },
    rangeTitleRow: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 24,
      width: '100%'
    },
    rangeTitleGradient: {
      alignSelf: 'center',
      height: 24,
      maxWidth: '100%',
      width: '100%'
    },
    rangeTitleGradientFill: {
      height: 24,
      width: '100%'
    },
    rangeTitleMaskWrap: {
      backgroundColor: 'transparent',
      height: 24,
      justifyContent: 'center',
      width: '100%'
    },
    rangeTitleMask: {
      color: '#000000',
      fontFamily: FONT.title,
      fontSize: 20,
      includeFontPadding: false,
      lineHeight: 24,
      textAlign: 'center',
      width: '100%'
    },
    quickDayRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: 10
    },
    quickDayCenter: {
      flexDirection: 'row',
      flexShrink: 0,
      gap: 8
    },
    navArrowSlot: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingVertical: 4
    },
    monthSlider: {
      alignSelf: 'stretch',
      marginBottom: 6,
      marginHorizontal: -16,
      marginTop: 0,
      maxWidth: '100%'
    },
    monthSliderContent: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 16,
      paddingVertical: 6
    },
    monthSliderYear: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: MONTH_SLIDER_YEAR_WIDTH,
      paddingHorizontal: 4
    },
    monthSliderYearText: {
      color: theme.mutedText,
      fontFamily: FONT.bodyBold,
      fontSize: 12
    },
    monthSliderItem: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderRadius: 999,
      height: 34,
      justifyContent: 'center',
      minWidth: MONTH_SLIDER_ITEM_WIDTH,
      paddingHorizontal: 10
    },
    monthSliderItemText: {
      color: theme.fieldText,
      fontFamily: FONT.bodyBold,
      fontSize: 13,
      textAlign: 'center'
    },
    monthSliderItemTextActive: {
      color: BRAND_GRADIENT_TEXT,
      fontFamily: FONT.bodyBold,
      fontSize: 13,
      textAlign: 'center'
    },
    quickDayButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderRadius: 999,
      justifyContent: 'center',
      minHeight: 40,
      paddingVertical: 8,
      width: 96
    },
    quickDayButtonText: {
      color: theme.fieldText,
      fontFamily: FONT.bodyBold,
      fontSize: 14,
      textAlign: 'center'
    },
    quickDayButtonTextActive: {
      color: BRAND_GRADIENT_TEXT,
      fontFamily: FONT.bodyBold,
      fontSize: 14,
      textAlign: 'center'
    },
    syncText: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 12,
      marginBottom: 10
    },
    loadingPanel: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderRadius: 8,
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
      padding: 14
    },
    loadingText: {
      color: theme.secondaryText,
      fontFamily: FONT.bodyBold
    },
    emptyState: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderRadius: 8,
      padding: 22
    },
    emptyTitle: {
      color: theme.fieldText,
      fontFamily: FONT.title,
      fontSize: 16
    },
    emptyHint: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
      textAlign: 'center'
    },
    emptyAction: {
      marginTop: 14
    },
    emptyActionText: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 14
    },
    daySection: {
      marginTop: 14
    },
    dayTitle: {
      color: theme.text,
      fontFamily: FONT.title,
      fontSize: 17,
      marginBottom: 8
    },
    noClasses: {
      color: theme.fieldText,
      fontFamily: FONT.body,
      fontSize: 14,
      paddingVertical: 8
    },
    classCard: {
      backgroundColor: theme.surfaceBg,
      borderRadius: 8,
      flexDirection: 'row',
      marginBottom: 10,
      overflow: 'hidden',
      shadowColor: theme.shadow,
      shadowOpacity: theme.name === 'dark' ? 0.18 : 0.06,
      shadowRadius: 8,
      elevation: 1
    },
    classCardMuted: {
      opacity: 0.58
    },
    classStripe: {
      width: 7
    },
    classStripeMuted: {
      opacity: 0.72
    },
    classTextCrossedOut: {
      textDecorationLine: 'line-through',
      textDecorationStyle: 'solid',
      color: theme.mutedText
    },
    classContent: {
      flex: 1,
      padding: 12
    },
    classTimeRow: {
      flexDirection: 'row',
      marginBottom: 4
    },
    classTimeSlot: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center',
      minWidth: 0,
      paddingHorizontal: 2
    },
    classTimeSlotText: {
      textAlign: 'center',
      width: '100%'
    },
    classTime: {
      color: theme.accent,
      fontFamily: FONT.bodyBold,
      fontSize: 13
    },
    classTimeStandalone: {
      marginBottom: 4
    },
    classLocationKind: {
      color: theme.mutedText,
      fontFamily: FONT.bodyBold,
      fontSize: 13
    },
    classLocationDetail: {
      color: theme.secondaryText,
      fontFamily: FONT.body,
      fontSize: 13
    },
    classLocationLink: {
      color: theme.accentDark,
      fontFamily: FONT.bodyBold,
      fontSize: 13
    },
    classTitle: {
      color: theme.text,
      fontFamily: FONT.title,
      fontSize: 16,
      lineHeight: 21
    },
    classMetaBadge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.surfaceBg,
      borderColor: theme.metaBadgeBorder,
      borderRadius: 6,
      borderWidth: 1,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 4
    },
    classMeta: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 14,
      lineHeight: 18
    },
    detailList: {
      borderTopColor: theme.divider,
      borderTopWidth: 1,
      gap: 4,
      marginTop: 10,
      paddingTop: 8
    },
    detailRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: 8
    },
    detailLabel: {
      color: theme.mutedText,
      fontFamily: FONT.bodyBold,
      fontSize: 12,
      includeFontPadding: false,
      lineHeight: 17,
      minWidth: 78
    },
    detailValue: {
      color: theme.secondaryText,
      flex: 1,
      flexShrink: 1,
      fontFamily: FONT.body,
      fontSize: 12,
      includeFontPadding: false,
      lineHeight: 17,
      minWidth: 0
    },
    detailValueAccent: {
      color: theme.accentDark,
      fontFamily: FONT.bodyBold
    }
  });
}

const settingsShellStyles = StyleSheet.create({
  content: {
    flex: 1,
    overflow: 'hidden'
  },
  contentScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 20
  },
  drawer: {
    bottom: 0,
    elevation: 12,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    top: 0,
    zIndex: 3
  },
  drawerSafeArea: {
    flex: 1
  },
  edgeSwipeZone: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 4
  },
  peekOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    zIndex: 2
  },
  root: {
    flex: 1,
    overflow: 'hidden'
  }
});

function createUniversityPortalStyles(theme) {
  return StyleSheet.create({
    closeButton: {
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
      width: 40
    },
    loadingWrap: {
      alignItems: 'center',
      flex: 1,
      justifyContent: 'center'
    },
    safeArea: {
      backgroundColor: theme.screenBg,
      flex: 1
    },
    toolbar: {
      alignItems: 'center',
      borderBottomColor: theme.divider,
      borderBottomWidth: 1,
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8
    },
    toolbarTitle: {
      color: theme.text,
      flex: 1,
      fontFamily: FONT.bodyBold,
      fontSize: 16
    },
    webView: {
      flex: 1
    }
  });
}

function createConfirmModalStyles(theme) {
  return StyleSheet.create({
    closeButton: {
      alignItems: 'center',
      backgroundColor: theme.surfaceBg,
      borderRadius: 20,
      height: 40,
      justifyContent: 'center',
      width: 40
    },
    confirmText: {
      color: theme.text,
      fontFamily: FONT.body,
      fontSize: 15,
      lineHeight: 22
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16
    },
    helpLink: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 6,
      marginTop: 10
    },
    helpText: {
      color: theme.formFocus,
      fontFamily: FONT.bodyBold,
      fontSize: 13
    },
    iconWrap: {
      alignItems: 'center',
      borderRadius: 16,
      height: 48,
      justifyContent: 'center',
      width: 48
    },
    input: {
      backgroundColor: theme.screenBg,
      borderColor: theme.formMuted,
      borderRadius: 8,
      borderWidth: 1,
      color: theme.text,
      fontFamily: FONT.body,
      fontSize: 15,
      minHeight: 48,
      paddingHorizontal: 14,
      paddingVertical: 12
    },
    panel: {
      backgroundColor: theme.screenBg,
      borderRadius: 20,
      maxWidth: 520,
      padding: 18,
      width: '100%'
    },
    primaryButton: {
      borderRadius: 12,
      flex: 1,
      overflow: 'hidden'
    },
    primaryGradient: {
      alignItems: 'center',
      paddingVertical: 12
    },
    primaryText: {
      color: BRAND_GRADIENT_TEXT,
      fontFamily: FONT.bodyBold,
      fontSize: 14
    },
    scrim: {
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.45)',
      flex: 1,
      justifyContent: 'center',
      padding: 20
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: theme.activeBg,
      borderColor: theme.border,
      borderRadius: 12,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 12
    },
    secondaryButtonText: {
      color: theme.fieldText,
      fontFamily: FONT.bodyBold,
      fontSize: 14
    },
    subtitle: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 13,
      marginTop: 2
    },
    title: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 17
    },
    titleBlock: {
      flex: 1
    }
  });
}

function createSettingsDrawerStyles(theme) {
  return StyleSheet.create({
    ...createStudioBrandStyles({
      alignItems: 'flex-start',
      marginTop: 0,
      paddingTop: 0
    }),
    divider: {
      backgroundColor: theme.divider,
      height: 1,
      marginVertical: 8
    },
    footerRow: {
      alignItems: 'center',
      alignSelf: 'stretch',
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 52,
      paddingHorizontal: 20,
      paddingVertical: 10,
      width: '100%'
    },
    logoutFooterLabel: {
      color: theme.text,
      fontFamily: FONT.bodyBold,
      fontSize: 16
    },
    logoutFooterPressable: {
      alignItems: 'center',
      flexDirection: 'row',
      flexShrink: 0,
      gap: 8,
      marginLeft: 12
    },
    studioBrandWrap: {
      flexShrink: 1,
      minWidth: 0,
      opacity: 0.3
    },
    brandZone: {
      alignItems: 'center',
      flexGrow: 0,
      justifyContent: 'center',
      overflow: 'hidden',
      paddingTop: 40,
      width: '100%',
      zIndex: 2
    },
    drawerMain: {
      alignSelf: 'stretch',
      flexGrow: 0,
      width: '100%'
    },
    drawerBrandTextMask: {
      color: '#000000',
      fontFamily: FONT.title,
      fontSize: 28,
      includeFontPadding: false,
      lineHeight: 44,
      paddingBottom: 2
    },
    drawerBrandTextWrap: {
      alignSelf: 'center',
      justifyContent: 'flex-start',
      marginTop: 8,
      maxWidth: '100%',
      overflow: 'hidden',
      paddingHorizontal: 4
    },
    drawerBrandWrap: {
      alignItems: 'center',
      maxWidth: '100%',
      overflow: 'hidden',
      paddingBottom: 4
    },
    drawerLogo: {
      borderRadius: 16,
      height: SETTINGS_DRAWER_LOGO_SIZE,
      overflow: 'hidden',
      width: SETTINGS_DRAWER_LOGO_SIZE
    },
    drawerLogoLayer: {
      left: 0,
      position: 'absolute',
      top: 0
    },
    drawerLogoWrap: {
      alignItems: 'center',
      height: SETTINGS_DRAWER_LOGO_SIZE,
      justifyContent: 'center',
      overflow: 'hidden',
      width: SETTINGS_DRAWER_LOGO_SIZE
    },
    menuBlock: {
      flexGrow: 0,
      justifyContent: 'flex-start',
      marginTop: 4,
      width: '100%',
      zIndex: 1
    },
    menuIcon: {
      marginRight: 16
    },
    menuLabel: {
      color: theme.text,
      flex: 1,
      flexShrink: 1,
      fontFamily: FONT.bodyBold,
      fontSize: 16,
      minWidth: 0
    },
    menuRow: {
      alignItems: 'center',
      alignSelf: 'stretch',
      flexDirection: 'row',
      minHeight: 52,
      paddingHorizontal: 20,
      paddingVertical: 10,
      width: '100%'
    },
    menuRowPressable: {
      alignSelf: 'stretch',
      width: '100%'
    },
    menuRowPressed: {
      backgroundColor: theme.panelAlt
    },
    menuTrailing: {
      flexShrink: 0,
      marginLeft: 12
    },
    safeArea: {
      alignSelf: 'stretch',
      backgroundColor: theme.screenBg,
      flex: 1,
      width: '100%'
    },
    scrollView: {
      alignSelf: 'stretch',
      flex: 1,
      width: '100%'
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 12,
      width: '100%'
    },
    sectionTitle: {
      color: theme.mutedText,
      fontFamily: FONT.bodyBold,
      fontSize: 12,
      letterSpacing: 0.6,
      marginBottom: 4,
      marginTop: 12,
      paddingHorizontal: 20,
      textTransform: 'uppercase'
    },
    sectionTitleFirst: {
      marginTop: 0
    },
    studentDataBlock: {
      marginBottom: 4,
      width: '100%'
    },
    studentDataRow: {
      paddingHorizontal: 20,
      paddingVertical: 6
    },
    studentDataLabel: {
      color: theme.mutedText,
      fontFamily: FONT.body,
      fontSize: 12,
      marginBottom: 4
    },
    studentDataInput: {
      backgroundColor: theme.surfaceBg,
      borderColor: theme.divider,
      borderRadius: 10,
      borderWidth: 1,
      color: theme.text,
      fontFamily: FONT.body,
      fontSize: 14,
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8
    },
    studentDataValue: {
      color: theme.text,
      fontFamily: FONT.body,
      fontSize: 14,
      lineHeight: 20,
      paddingVertical: 2
    },
    toggleGradient: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 999
    },
    toggleGradientFill: {
      flex: 1
    },
    toggleThumb: {
      height: SETTINGS_TOGGLE_THUMB,
      width: SETTINGS_TOGGLE_THUMB
    },
    toggleThumbGray: {
      backgroundColor: '#d1d5db'
    },
    toggleThumbLayer: {
      borderRadius: 999,
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    toggleThumbWhite: {
      backgroundColor: '#ffffff',
      elevation: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2
    },
    toggleTrack: {
      backgroundColor: theme.surfaceBg,
      borderColor: theme.divider,
      borderRadius: 999,
      borderWidth: 1,
      height: SETTINGS_TOGGLE_HEIGHT,
      justifyContent: 'center',
      overflow: 'hidden',
      padding: SETTINGS_TOGGLE_PADDING,
      width: SETTINGS_TOGGLE_WIDTH
    }
  });
}
