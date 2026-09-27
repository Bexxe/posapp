import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEY = '@posapp_auth_session_v1';
const VALID_USERNAME = 'ferhatbalıkçılık';
const VALID_PASSWORD = '02315052';

export interface AuthSession {
  isLoggedIn: boolean;
  username: string;
  rememberMe: boolean;
  loginTime: number;
}

/**
 * Kullanıcı adını esnek ve hataya dayanıklı doğrulamak için normalize eder.
 * "ferhatbalıkçılık", "Ferhat Balıkçılık", "ferhatbalikcilik" varyasyonlarını kabul eder.
 */
function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, '')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c');
}

export function checkCredentials(user: string, pass: string): boolean {
  const normUser = normalizeUsername(user);
  const targetNorm = normalizeUsername(VALID_USERNAME);

  const isUserValid = normUser === targetNorm || user.trim().toLowerCase() === VALID_USERNAME;
  const isPassValid = pass.trim() === VALID_PASSWORD;

  return isUserValid && isPassValid;
}

/**
 * Oturum durumunu kontrol eder.
 * Beni hatırla açık bir şekilde giriş yapıldıysa kalıcı olarak oturumu aktif sayar.
 */
export async function checkAuthSession(): Promise<boolean> {
  try {
    // 1. Tarayıcı ortamında localStorage kontrolü (Anında yanıt)
    if (typeof window !== 'undefined' && window.localStorage) {
      const localData = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (localData) {
        const session: AuthSession = JSON.parse(localData);
        if (session && session.isLoggedIn) {
          return true;
        }
      }
    }

    // 2. React Native AsyncStorage kontrolü
    const asyncData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (asyncData) {
      const session: AuthSession = JSON.parse(asyncData);
      if (session && session.isLoggedIn) {
        return true;
      }
    }
  } catch (error) {
    console.error('Oturum kontrol edilirken hata:', error);
  }

  return false;
}

/**
 * Giriş işlemi yapar ve istenirse "Beni Hatırla" ile kalıcı olarak kaydeder.
 */
export async function performLogin(
  user: string,
  pass: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user || !user.trim()) {
      return { success: false, error: 'Lütfen kullanıcı adınızı girin.' };
    }

    if (!pass || !pass.trim()) {
      return { success: false, error: 'Lütfen şifrenizi girin.' };
    }

    const isValid = checkCredentials(user, pass);
    if (!isValid) {
      return { success: false, error: 'Kullanıcı adı veya şifre hatalı!' };
    }

    const session: AuthSession = {
      isLoggedIn: true,
      username: VALID_USERNAME,
      rememberMe: rememberMe,
      loginTime: Date.now(),
    };

    const sessionStr = JSON.stringify(session);

    // Kalıcı saklama: Web localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      if (rememberMe) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, sessionStr);
      } else {
        window.sessionStorage.setItem(AUTH_STORAGE_KEY, sessionStr);
      }
    }

    // Kalıcı saklama: AsyncStorage
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, sessionStr);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Giriş yapılırken bir hata oluştu.' };
  }
}

/**
 * Oturumu kapatır ve saklanan bilgileri temizler.
 */
export async function performLogout(): Promise<void> {
  try {
    if (typeof window !== 'undefined') {
      if (window.localStorage) window.localStorage.removeItem(AUTH_STORAGE_KEY);
      if (window.sessionStorage) window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('Çıkış yapılırken hata:', error);
  }
}
