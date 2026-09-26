export interface OdealSettings {
  productName: string;
  vatRate: number; // örn: 1 veya 20
  externalDeviceKey: string; // Ödeal POS makinesinden alınan Cihaz Kodu (örn: 852456)
  terminalId?: string; // Ödeal Terminal ID (örn: 685614)
  merchantKey: string;
  secretKey: string;
  requestKey?: string; // Webhook / Request Key (örn: 01lounge_odeal_webhook_secret_key)
  isProduction: boolean;
  isMockMode: boolean;
  // IBAN & QR Bilgileri
  ibanTitle?: string;
  ibanNumber?: string;
  ibanBank?: string;
  qrCodeData?: string;
  qrCodeImage?: string; // Yüklenen karekod görseli (Base64 data URI)
}

export interface OdealCustomer {
  type: 'INDIVIDUAL' | 'CORPORATE';
  name?: string;
  city?: string;
  town?: string;
}

export interface OdealBasketItem {
  name: string;
  vatRate: number;
  price: number; // KDV hariç birim fiyat
  grossPrice: number; // KDV dahil birim fiyat
  quantity: number;
  unit: string; // "ADET", "KG" vb.
}

export interface OdealBasketPayload {
  referenceCode: string;
  externalDeviceKey: string;
  basketType: 'SIMPLE';
  customer: OdealCustomer;
  price: number; // KDV hariç toplam tutar
  grossPrice: number; // KDV dahil toplam tahsil edilecek tutar
  items: OdealBasketItem[];
}

export interface OdealTransactionResult {
  success: boolean;
  message: string;
  statusType?: 'SUCCESS' | 'DECLINED' | 'INSUFFICIENT_FUNDS' | 'CANCELLED' | 'ERROR';
  responseCode?: string;
  basketId?: string;
  referenceCode?: string;
  rawResponse?: any;
  timestamp: string;
  amount: number;
  productName: string;
  vatRate: number;
}
