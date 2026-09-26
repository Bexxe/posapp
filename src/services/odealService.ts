import { Platform } from 'react-native';
import { OdealBasketPayload, OdealSettings, OdealTransactionResult } from '../types/odeal';

/**
 * Banka ve Ödeal Hata & Callback Kodları
 */
export const POS_RESPONSE_CODES: Record<string, string> = {
  '00': 'İşlem Başarılı / Tahsilat Onaylandı',
  '05': 'Ödeme Reddedildi: Banka onay vermedi (Do Not Honor).',
  '51': 'Ödeme Reddedildi: Yetersiz Bakiye! Kartta yeterli limit/fon bulunmuyor.',
  '54': 'Ödeme Reddedildi: Kartın Son Kullanma Tarihi Geçmiş.',
  '55': 'Ödeme Reddedildi: Hatalı Şifre (Geçersiz PIN).',
  '41': 'Ödeme Reddedildi: Kayıp Kart Bildirimi.',
  '43': 'Ödeme Reddedildi: Çalıntı Kart Bildirimi.',
  '34': 'Ödeme Reddedildi: Sahtekarlık / Güvenlik Şüphesi.',
  '91': 'Kartı Veren Banka Yanıt Vermiyor (Red91). Test ortamında yalnızca test kartları geçerlidir.',
  '96': 'Sistem / İletişim Hatası. Lütfen tekrar deneyin.',
  'CANCELLED': 'İşlem İptal Edildi: POS cihazı ekranından veya kasa tarafından işlem iptal edildi.',
  'TIMEOUT': 'Zaman Aşımı: POS cihazında süre doldu (Kart okutulmadı).',
  'DEVICE_OFFLINE': 'Ödeal POS Cihazı Çevrimdışı: POS makinesi kapalı veya internete bağlı değil.',
  'DEVICE_NOT_FOUND': 'Cihaz Kodu Bulunamadı: Girdiğiniz externalDeviceKey Ödeal sisteminde kayıtlı değil. POS uygulamasında "Cihazlarım" menüsünü kontrol edin.',
  'INVALID_CREDENTIALS': 'Kimlik Doğrulama Hatası: Merchant Key veya Secret Key geçersiz.',
};

/**
 * Hata ve Cevap Kodlarını Analiz Edip Sınıflandırma
 */
export function classifyResponse(code?: string, text?: string): {
  statusType: 'SUCCESS' | 'DECLINED' | 'INSUFFICIENT_FUNDS' | 'CANCELLED' | 'ERROR';
  cleanMessage: string;
} {
  const normCode = (code || '').toUpperCase().trim();
  const lowerText = (text || '').toLowerCase();

  if (normCode === '00') {
    return {
      statusType: 'SUCCESS',
      cleanMessage: 'İşlem Başarılı / Tahsilat Onaylandı.',
    };
  }

  // 1. Yetersiz Bakiye kontrolü (Banka Kodu 51)
  if (
    normCode === '51' ||
    lowerText.includes('yetersiz bakiye') ||
    lowerText.includes('insufficient funds') ||
    lowerText.includes('limit yetersiz') ||
    lowerText.includes('bakiye yetersiz')
  ) {
    return {
      statusType: 'INSUFFICIENT_FUNDS',
      cleanMessage:
        'Ödeme Reddedildi: Yetersiz Bakiye! Müşterinin kartında yeterli limit veya bakiye bulunmuyor. Farklı bir kart isteyebilir veya IBAN/QR ile tahsilat yapabilirsiniz.',
    };
  }

  // 2. İşlem İptali (Kasiyer / POS ekranından iptal)
  if (
    normCode === 'CANCELLED' ||
    normCode === 'CANCELED' ||
    lowerText.includes('iptal') ||
    lowerText.includes('cancelled') ||
    lowerText.includes('canceled')
  ) {
    return {
      statusType: 'CANCELLED',
      cleanMessage:
        'İşlem İptal Edildi: POS cihazı ekranından veya kasa tarafından işlem iptal edildi. Karttan herhangi bir çekim yapılmadı.',
    };
  }

  // 3. Banka Onay Vermedi (05 - Do Not Honor)
  if (
    normCode === '05' ||
    lowerText.includes('onay vermedi') ||
    lowerText.includes('do not honor') ||
    lowerText.includes('reddedildi')
  ) {
    return {
      statusType: 'DECLINED',
      cleanMessage:
        'Ödeme Reddedildi: Banka onay vermedi (Do Not Honor). Müşteri bankası ile iletişime geçmelidir.',
    };
  }

  // 4. Kartın son kullanma tarihi geçmiş (54)
  if (normCode === '54' || lowerText.includes('son kullanma') || lowerText.includes('expired')) {
    return {
      statusType: 'DECLINED',
      cleanMessage: 'Ödeme Reddedildi: Kartın Son Kullanma Tarihi Geçmiş (Expired Card).',
    };
  }

  // 5. Hatalı PIN / Şifre (55)
  if (
    normCode === '55' ||
    lowerText.includes('hatalı şifre') ||
    lowerText.includes('yanlış pin') ||
    lowerText.includes('invalid pin')
  ) {
    return {
      statusType: 'DECLINED',
      cleanMessage: 'Ödeme Reddedildi: Hatalı Şifre (Geçersiz PIN). Lütfen PIN kodunu kontrol edin.',
    };
  }

  // 6. Kayıp / Çalıntı (41, 43)
  if (
    normCode === '41' ||
    normCode === '43' ||
    lowerText.includes('çalıntı') ||
    lowerText.includes('kayıp') ||
    lowerText.includes('stolen') ||
    lowerText.includes('lost card')
  ) {
    return {
      statusType: 'DECLINED',
      cleanMessage: 'Ödeme Reddedildi: Kayıp / Çalıntı Kart Bildirimi. Bu kart kullanılamaz.',
    };
  }

  // 7. Banka İletişim Hatası (91)
  if (normCode === '91' || lowerText.includes('banka yanıt vermiyor') || lowerText.includes('red91')) {
    return {
      statusType: 'DECLINED',
      cleanMessage:
        'Ödeme Reddedildi: Kartı Veren Banka Yanıt Vermiyor (Banka İletişim Hatası). Test ortamında yalnızca test kartları geçerlidir.',
    };
  }

  // 8. Zaman Aşımı
  if (normCode === 'TIMEOUT' || lowerText.includes('zaman aşımı') || lowerText.includes('timeout')) {
    return {
      statusType: 'ERROR',
      cleanMessage: 'Zaman Aşımı: POS cihazında kart okutma süresi doldu.',
    };
  }

  // Diğer kodlar
  if (POS_RESPONSE_CODES[normCode]) {
    return {
      statusType: 'DECLINED',
      cleanMessage: POS_RESPONSE_CODES[normCode],
    };
  }

  return {
    statusType: 'ERROR',
    cleanMessage: text || 'İşlem Başarısız: Beklenmeyen bir hata oluştu.',
  };
}

/**
 * Ödeal D2D Sepet Aktarım Servisi (POST /api/v1/basket)
 * Ödeal resmi dökümanına tam uyumlu gövde ve başlık yapısı
 */
export async function sendBasketToOdeal(params: {
  amount: number;
  settings: OdealSettings;
}): Promise<OdealTransactionResult> {
  const { amount, settings } = params;
  const timestamp = new Date().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // 1. ZORUNLU KONTROL: Secret Key, Merchant Key ve Cihaz Kodu Giriş Kontrolü
  const hasMerchantKey = Boolean(settings.merchantKey && settings.merchantKey.trim().length > 3);
  const hasSecretKey = Boolean(settings.secretKey && settings.secretKey.trim().length > 3);
  const hasDeviceKey = Boolean(settings.externalDeviceKey && settings.externalDeviceKey.trim().length > 1);

  if (!hasDeviceKey || !hasMerchantKey || !hasSecretKey) {
    const missingFields: string[] = [];
    if (!hasDeviceKey) missingFields.push('Cihaz Kodu (externalDeviceKey)');
    if (!hasMerchantKey) missingFields.push('Merchant Key');
    if (!hasSecretKey) missingFields.push('Secret Key');

    return {
      success: false,
      message: `Ödeal POS Gönderimi Başarısız!\n\nAşağıdaki bilgiler eksik:\n• ${missingFields.join('\n• ')}\n\nLütfen sağ üstteki Ayarlar menüsünden bilgilerinizi kaydedin.`,
      timestamp,
      amount,
      productName: settings.productName || 'Taze Balık / Satış',
      vatRate: settings.vatRate,
    };
  }

  // 2. Simülasyon (Mock) Modu: Yalnızca kullanıcı bilinçli olarak açtıysa
  if (settings.isMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      success: true,
      message: `Simülasyon Modu: Satış talebi test POS cihazına (${settings.externalDeviceKey}) aktarıldı.`,
      basketId: `MOCK-${Date.now().toString().slice(-6)}`,
      referenceCode: `REF-${Date.now()}`,
      timestamp,
      amount,
      productName: settings.productName,
      vatRate: settings.vatRate,
      rawResponse: {
        status: 'SUCCESS',
        mode: 'SIMULATION',
        responseCode: '00',
        device: settings.externalDeviceKey,
      },
    };
  }

  // 3. Gerçek Ödeal D2D Sepet Oluşturma (docs.odeal.com resmi Swagger spesifikasyonu)
  const isWeb = Platform.OS === 'web';
  const targetHost = settings.isProduction ? 'api.odeal.com' : 'api.stg.odeal.com';
  const directBaseUrl = settings.isProduction
    ? 'https://api.odeal.com/api/v1'
    : 'https://api.stg.odeal.com/api/v1';

  // Tarayıcı ortamında (Chrome/Edge/Safari) CORS engelini aşmak için Metro yerel proxy'sini kullan
  const requestUrl = isWeb
    ? `/odeal-proxy/api/v1/basket`
    : `${directBaseUrl}/basket`;

  const vatRate = Math.round(Number(settings.vatRate) || 1);
  const grossPrice = Number(amount.toFixed(2)); // KDV dahil toplam tutar
  const referenceCode = `FB-${Date.now()}`;
  const prodName = settings.productName?.trim() || 'FerhatBalik';
  const deviceKey = settings.externalDeviceKey?.trim() || '852456';

  // Ödeal resmi Swagger BasketRequest veri şeması:
  // required: ["referenceCode", "customer", "price", "items", "paymentOptions"]
  const payload = {
    referenceCode,
    externalDeviceKey: deviceKey,
    basketType: 'SIMPLE',
    customer: {
      type: 'INDIVIDUAL',
      name: 'Nihai',
      surname: 'Tuketici',
      identityNumber: '11111111111',
      city: 'Istanbul',
      town: 'Kadikoy',
    },
    price: {
      grossPrice: grossPrice,
    },
    items: [
      {
        quantity: 1,
        product: {
          name: prodName,
          referenceCode: `PRD-${Date.now().toString().slice(-4)}`,
          unitCode: 'C62',
          price: {
            grossPrice: grossPrice,
            vatRatio: vatRate,
          },
        },
      },
    ],
    paymentOptions: [
      {
        amount: grossPrice,
        type: 'CREDITCARD',
      },
    ],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 saniye zaman aşımı

    const requestHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'X-ODEAL-MERCHANT-KEY': settings.merchantKey.trim(),
      'X-ODEAL-SECRET-KEY': settings.secretKey.trim(),
      'X-ODEAL-AGENT': 'OdealSdkClient/2.1.3',
    };
    if (isWeb) {
      requestHeaders['x-target-host'] = targetHost;
    }

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // Metro proxy 404 dönerse veya port 3001 proxy'si varsa dene
      if (isWeb && response.status === 404) {
        try {
          const p3001 = await fetch('http://localhost:3001/api/v1/basket', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          if (p3001.ok || p3001.status !== 404) {
            response = p3001;
          }
        } catch (_) {}
      }
    } catch (fetchErr: any) {
      if (isWeb) {
        try {
          const p3001 = await fetch('http://localhost:3001/api/v1/basket', {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          response = p3001;
        } catch (_) {
          throw fetchErr;
        }
      } else {
        throw fetchErr;
      }
    }

    clearTimeout(timeoutId);

    const responseData = await response.json().catch(() => null);

    // 4. Yanıt ve Hata Yönetimi
    if (response.ok) {
      const responseCode = responseData?.responseCode || responseData?.data?.responseCode || '00';
      const classification = classifyResponse(
        responseCode,
        responseData?.message || responseData?.detail || ''
      );

      if (responseCode !== '00') {
        return {
          success: false,
          statusType: classification.statusType,
          responseCode,
          message: classification.cleanMessage,
          basketId: responseData?.data?.basketId || responseData?.basketId,
          referenceCode,
          rawResponse: responseData,
          timestamp,
          amount,
          productName: settings.productName,
          vatRate: settings.vatRate,
        };
      }

      return {
        success: true,
        statusType: 'SUCCESS',
        responseCode: '00',
        message: 'Sepet Ödeal POS cihazına aktarıldı. POS makinesinden müşteri kartını okutun.',
        basketId: responseData?.data?.basketId || responseData?.basketId || `BSK-${Date.now().toString().slice(-6)}`,
        referenceCode,
        rawResponse: responseData,
        timestamp,
        amount,
        productName: settings.productName,
        vatRate: settings.vatRate,
      };
    } else {
      const errCode =
        responseData?.responseCode ||
        responseData?.code ||
        responseData?.errorCode ||
        responseData?.errors?.[0]?.code;

      const rawDetail =
        responseData?.message ||
        responseData?.error ||
        responseData?.detail ||
        (responseData?.errors ? JSON.stringify(responseData.errors) : '') ||
        (responseData?.result?.message || '');

      const classification = classifyResponse(errCode, rawDetail);

      let humanMessage = classification.cleanMessage;

      if (!POS_RESPONSE_CODES[errCode] && !rawDetail) {
        if (response.status === 401 || response.status === 403) {
          humanMessage = 'Ödeal Kimlik Doğrulama Hatası (401/403): Merchant Key veya Secret Key hatalı!';
        } else if (response.status === 404) {
          humanMessage = `Ödeal Cihaz Kodu "${settings.externalDeviceKey}" bulunamadı. POS uygulamasında "Cihazlarım" sekmesinden cihaz kodunuzu doğrulayın.`;
        } else {
          humanMessage = `Ödeal Servis Yanıtı (HTTP ${response.status})`;
        }
      }

      return {
        success: false,
        statusType: classification.statusType,
        responseCode: errCode || `HTTP_${response.status}`,
        message: humanMessage.startsWith('Ödeme Reddedildi') || humanMessage.startsWith('İşlem İptal') || humanMessage.startsWith('Zaman Aşımı')
          ? humanMessage
          : `İşlem Başarısız:\n${humanMessage}`,
        rawResponse: responseData,
        referenceCode,
        timestamp,
        amount,
        productName: settings.productName,
        vatRate: settings.vatRate,
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'Zaman Aşımı (25s): POS makinesi veya Ödeal sunucusu yanıt vermedi. POS makinenizin açık ve internete bağlı olduğunu kontrol edin.',
        timestamp,
        amount,
        productName: settings.productName,
        vatRate: settings.vatRate,
      };
    }

    const isStage = !settings.isProduction;
    let stageHint = isStage
      ? '\n\n💡 İpucu: Test sunucusuna (api.stg.odeal.com) erişilemedi. İşletmenizdeki gerçek Ödeal POS makinesini kullanıyorsanız Ayarlar menüsünden "Canlı (Production) Ortamı" anahtarını açın.'
      : '\n\n💡 İpucu: Ödeal canlı sunucusuna bağlanılamadı. İnternet bağlantınızı ve Merchant/Secret Key anahtarlarınızı kontrol edin.';

    if (isWeb && (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError'))) {
      stageHint = '\n\n💡 Web Tarayıcısı (CORS) Güvenlik Uyarısı:\nTarayıcınız güvenlik sebebiyle doğrudan Ödeal API\'sine bağlanmayı kısıtladı.\n\nÇözüm:\n1. Terminalinizdeki "npx expo start" penceresinde Ctrl+C yapıp tekrar başlatın (eklediğimiz Proxy aktifleşecektir).\n2. Veya iPhone üzerinden test edin.';
    }

    return {
      success: false,
      message: `Bağlantı Hatası: ${error?.message || 'Ödeal sunucusuna bağlanılamadı.'}${stageHint}`,
      timestamp,
      amount,
      productName: settings.productName,
      vatRate: settings.vatRate,
    };
  }
}

/**
 * Ödeal Bağlantı ve Konfigürasyon Testi (GET /api/v1/configuration)
 */
export async function testOdealConnection(settings: OdealSettings): Promise<{
  success: boolean;
  message: string;
}> {
  if (!settings.merchantKey?.trim() || !settings.secretKey?.trim()) {
    return {
      success: false,
      message: 'Test için Merchant Key ve Secret Key girilmesi zorunludur.',
    };
  }

  const isWeb = Platform.OS === 'web';
  const targetHost = settings.isProduction ? 'api.odeal.com' : 'api.stg.odeal.com';
  const directBaseUrl = settings.isProduction
    ? 'https://api.odeal.com/api/v1'
    : 'https://api.stg.odeal.com/api/v1';

  const requestUrl = isWeb
    ? `/odeal-proxy/api/v1/configuration`
    : `${directBaseUrl}/configuration`;

  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-ODEAL-MERCHANT-KEY': settings.merchantKey.trim(),
      'X-ODEAL-SECRET-KEY': settings.secretKey.trim(),
      'X-ODEAL-AGENT': 'OdealSdkClient/2.1.3',
    };
    if (isWeb) {
      headers['x-target-host'] = targetHost;
    }

    let response = await fetch(requestUrl, {
      method: 'GET',
      headers,
    });

    if (isWeb && response.status === 404) {
      try {
        response = await fetch(`${directBaseUrl}/configuration`, {
          method: 'GET',
          headers,
        });
      } catch (_) {}
    }

    if (response.ok) {
      const data = await response.json().catch(() => null);
      return {
        success: true,
        message: 'Ödeal API bağlantısı başarılı! Anahtarlarınız doğrulandı.',
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        message: 'Yetkilendirme Başarısız: Merchant Key veya Secret Key geçersiz.',
      };
    } else {
      return {
        success: false,
        message: `Sunucu Yanıtı: HTTP ${response.status}`,
      };
    }
  } catch (err: any) {
    let errHint = '';
    if (isWeb && (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError'))) {
      errHint = '\n\n💡 Tarayıcı CORS engeli: Terminalde Expo\'yu yeniden başlatarak proxy\'yi etkinleştirin.';
    }
    return {
      success: false,
      message: `Bağlantı Hatası: ${err?.message || 'Ödeal sunucusuna erişilemedi.'}${errHint}`,
    };
  }
}

/**
 * Ödeal Sepet İptali (DELETE /api/v1/basket/delete)
 * Ödeme henüz POS üzerinde çekilmediyse sepeti iptal eder ve cihaz ekranını temizler.
 */
export async function cancelOdealBasket(params: {
  referenceCode: string;
  settings: OdealSettings;
}): Promise<{ success: boolean; message: string; rawResponse?: any }> {
  const { referenceCode, settings } = params;

  if (settings.isMockMode) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      message: 'Simülasyon Modu: POS işlemi ve sepet başarıyla iptal edildi.',
    };
  }

  const isWeb = Platform.OS === 'web';
  const targetHost = settings.isProduction ? 'api.odeal.com' : 'api.stg.odeal.com';
  const directBaseUrl = settings.isProduction
    ? 'https://api.odeal.com/api/v1'
    : 'https://api.stg.odeal.com/api/v1';

  const queryParam = `?referenceCode=${encodeURIComponent(referenceCode)}`;
  const requestUrl = isWeb
    ? `/odeal-proxy/api/v1/basket/delete${queryParam}`
    : `${directBaseUrl}/basket/delete${queryParam}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-ODEAL-MERCHANT-KEY': settings.merchantKey.trim(),
    'X-ODEAL-SECRET-KEY': settings.secretKey.trim(),
    'X-ODEAL-AGENT': 'OdealSdkClient/2.1.3',
    'referenceCode': referenceCode,
  };
  if (isWeb) {
    headers['x-target-host'] = targetHost;
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'DELETE',
      headers,
    });

    if (response.status === 204 || response.ok) {
      return {
        success: true,
        message: 'İşlem Ödeal POS cihazından başarıyla iptal edildi. POS ekranı sıfırlandı.',
      };
    }

    const data = await response.json().catch(() => null);
    const detail =
      data?.message ||
      data?.detail ||
      data?.error ||
      (data ? JSON.stringify(data) : `HTTP ${response.status}`);
    return {
      success: false,
      message: `İptal Edilemedi: ${detail}`,
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `İptal Bağlantı Hatası: ${err?.message || 'Ödeal sunucusuna erişilemedi.'}`,
    };
  }
}

/**
 * Ödeal Ödeme İptal / İade (PUT /api/v1/payment/cancel)
 * Karttan çekilmiş olan ödemeyi iptal eder (Void/Refund).
 */
export async function cancelOdealPayment(params: {
  basketReferenceCode: string;
  settings: OdealSettings;
}): Promise<{ success: boolean; message: string; rawResponse?: any }> {
  const { basketReferenceCode, settings } = params;

  if (settings.isMockMode) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      success: true,
      message: 'Simülasyon Modu: Ödeme iptali / iadesi tamamlandı.',
    };
  }

  const isWeb = Platform.OS === 'web';
  const targetHost = settings.isProduction ? 'api.odeal.com' : 'api.stg.odeal.com';
  const directBaseUrl = settings.isProduction
    ? 'https://api.odeal.com/api/v1'
    : 'https://api.stg.odeal.com/api/v1';

  const requestUrl = isWeb
    ? `/odeal-proxy/api/v1/payment/cancel`
    : `${directBaseUrl}/payment/cancel`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
    'X-ODEAL-MERCHANT-KEY': settings.merchantKey.trim(),
    'X-ODEAL-SECRET-KEY': settings.secretKey.trim(),
    'X-ODEAL-AGENT': 'OdealSdkClient/2.1.3',
  };
  if (isWeb) {
    headers['x-target-host'] = targetHost;
  }

  try {
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ basketReferenceCode }),
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Tahsilat / Ödeme başarıyla iptal edildi (Void/Refund).',
      };
    }

    const data = await response.json().catch(() => null);
    const detail =
      data?.message ||
      data?.detail ||
      data?.error ||
      (data ? JSON.stringify(data) : `HTTP ${response.status}`);
    return {
      success: false,
      message: `Ödeme İptal Edilemedi: ${detail}`,
      rawResponse: data,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `İptal Bağlantı Hatası: ${err?.message || 'Ödeal sunucusuna erişilemedi.'}`,
    };
  }
}

/**
 * İşlemi İptal Et (Akıllı İptal Yöneticisi)
 * Önce sepet iptalini dener, gerekirse ödeme iptalini devreye alır.
 */
export async function cancelActiveTransaction(params: {
  referenceCode: string;
  settings: OdealSettings;
}): Promise<{ success: boolean; message: string }> {
  // 1. Önce bekleyen sepeti silmeyi dene
  const basketCancel = await cancelOdealBasket(params);
  if (basketCancel.success) {
    return basketCancel;
  }

  // 2. Sepet bulunamadıysa veya ödeme alındıysa ödeme iptalini dene
  const paymentCancel = await cancelOdealPayment({
    basketReferenceCode: params.referenceCode,
    settings: params.settings,
  });

  if (paymentCancel.success) {
    return paymentCancel;
  }

  return {
    success: false,
    message: basketCancel.message || paymentCancel.message,
  };
}

