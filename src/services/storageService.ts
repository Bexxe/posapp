import AsyncStorage from '@react-native-async-storage/async-storage';
import { OdealSettings } from '../types/odeal';

const SETTINGS_STORAGE_KEY = '@posapp_odeal_settings_v4';

export const DEFAULT_SETTINGS: OdealSettings = {
  productName: 'FerhatBalik',
  vatRate: 1, // Balık ve gıdada KDV %1
  externalDeviceKey: '852456',
  terminalId: '685614',
  merchantKey: '668420e5-92c3-4487-837f-292590336685',
  secretKey: 'f08e76da88880a5d38d583c8a002e3089c6b5894ff02de80a6290fa5ae3d2b6e',
  requestKey: '01lounge_odeal_webhook_secret_key',
  isProduction: true, // CANLI (https://api.odeal.com/api/v1)
  isMockMode: false,
  ibanTitle: 'Ferhat Balıkçılık',
  ibanBank: 'Ziraat Bankası',
  ibanNumber: 'TR12 0001 0000 0000 0000 0000 00',
  qrCodeData: '',
  qrCodeImage: '',
};

export async function loadSettings(): Promise<OdealSettings> {
  try {
    // 1. Tarayıcı ortamında localStorage kontrolü (Hızlı ve kalıcı)
    if (typeof window !== 'undefined' && window.localStorage) {
      const localVal = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (localVal) {
        const parsed = JSON.parse(localVal);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          vatRate: typeof parsed.vatRate === 'number' ? parsed.vatRate : 1,
        };
      }
    }

    // 2. React Native AsyncStorage kontrolü
    const jsonValue = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        vatRate: typeof parsed.vatRate === 'number' ? parsed.vatRate : 1,
      };
    }
  } catch (error) {
    console.error('Ayarlar okunurken hata oluştu:', error);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: OdealSettings): Promise<boolean> {
  try {
    const sanitizedSettings: OdealSettings = {
      productName: settings.productName?.trim() || 'FerhatBalik',
      vatRate: typeof settings.vatRate === 'number' && !isNaN(settings.vatRate) ? settings.vatRate : 1,
      // API Anahtarları ve Bağlantı Parametreleri (Uygulama İçinde Sabit)
      externalDeviceKey: settings.externalDeviceKey?.trim() || DEFAULT_SETTINGS.externalDeviceKey,
      terminalId: settings.terminalId?.trim() || DEFAULT_SETTINGS.terminalId,
      merchantKey: settings.merchantKey?.trim() || DEFAULT_SETTINGS.merchantKey,
      secretKey: settings.secretKey?.trim() || DEFAULT_SETTINGS.secretKey,
      requestKey: settings.requestKey?.trim() || DEFAULT_SETTINGS.requestKey,
      isProduction: typeof settings.isProduction === 'boolean' ? settings.isProduction : DEFAULT_SETTINGS.isProduction,
      isMockMode: typeof settings.isMockMode === 'boolean' ? settings.isMockMode : DEFAULT_SETTINGS.isMockMode,
      ibanTitle: settings.ibanTitle?.trim() || 'Ferhat Balıkçılık',
      ibanNumber: settings.ibanNumber?.trim() || '',
      ibanBank: settings.ibanBank?.trim() || '',
      qrCodeData: settings.qrCodeData?.trim() || '',
      qrCodeImage: settings.qrCodeImage || '',
    };

    const jsonValue = JSON.stringify(sanitizedSettings);

    // Hem web localStorage hem AsyncStorage üzerine garanti kayıt
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, jsonValue);
    }
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, jsonValue);

    return true;
  } catch (error) {
    console.error('Ayarlar kaydedilirken hata oluştu:', error);
    return false;
  }
}
