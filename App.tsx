import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from './src/components/AppIcon';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './src/services/storageService';
import { cancelActiveTransaction, sendBasketToOdeal } from './src/services/odealService';
import { OdealSettings, OdealTransactionResult } from './src/types/odeal';
import { AmountDisplay } from './src/components/AmountDisplay';
import { InfoBadges } from './src/components/InfoBadges';
import { Numpad } from './src/components/Numpad';
import { SettingsModal } from './src/components/SettingsModal';
import { ResultModal } from './src/components/ResultModal';
import { CalculatorModal } from './src/components/CalculatorModal';
import { IbanQrModal } from './src/components/IbanQrModal';
import { LoginScreen } from './src/components/LoginScreen';
import { checkAuthSession, performLogout } from './src/services/authService';

// Web ortamında esnek tam ekran desteği (Tarayıcı barı değişimlerinde taşmayı ve kesilmeyi önler)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'posapp-viewport-style';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&display=swap');
      html, body, #root {
        min-height: 100% !important;
        min-height: 100dvh !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #0B132B !important;
        -webkit-text-size-adjust: 100% !important;
      }
      * {
        -webkit-tap-highlight-color: transparent;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(styleEl);
  }
}

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isShortScreen = windowHeight < 680;
  const isVeryShortScreen = windowHeight < 600;
  const isNarrowScreen = windowWidth < 430;
  const isVeryNarrowScreen = windowWidth < 370;

  const [settings, setSettings] = useState<OdealSettings>(DEFAULT_SETTINGS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [amountStr, setAmountStr] = useState<string>('0');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCalcOpen, setIsCalcOpen] = useState<boolean>(false);
  const [isIbanQrOpen, setIsIbanQrOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<OdealTransactionResult | null>(null);
  const [activeReferenceCode, setActiveReferenceCode] = useState<string | null>(null);
  const [isResultOpen, setIsResultOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Uygulama açılışında kayıtlı ayarları ve oturum durumunu yükle
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSettings();
        setSettings(saved);
      } catch (e) {
        console.error('Ayarlar yüklenemedi:', e);
      }

      try {
        const loggedIn = await checkAuthSession();
        setIsAuthenticated(loggedIn);
      } catch (e) {
        console.error('Oturum kontrol hatası:', e);
        setIsAuthenticated(false);
      }
    })();
  }, []);

  // Toast mesajı zamanlayıcısı
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sayısal tuş takımı girişi yönetimi
  const handleKeyPress = (key: string) => {
    setAmountStr((prev) => {
      // Virgül kontrolü
      if (key === ',') {
        if (prev.includes(',')) return prev;
        return prev + ',';
      }

      // 00 tuşu kontrolü
      if (key === '00') {
        if (prev === '0') return '0';
        if (prev.includes(',')) {
          const parts = prev.split(',');
          if (parts[1].length >= 2) return prev;
          if (parts[1].length === 1) return prev + '0';
          return prev + '00';
        }
        if (prev.length > 8) return prev;
        return prev + '00';
      }

      // Rakam girişi (0-9)
      if (prev === '0') {
        return key;
      }

      // Kuruş kısmında en fazla 2 hane kontrolü
      if (prev.includes(',')) {
        const parts = prev.split(',');
        if (parts[1] && parts[1].length >= 2) {
          return prev;
        }
      }

      // Maksimum 9 basamak sınırı
      if (prev.replace(',', '').length >= 9) {
        return prev;
      }

      return prev + key;
    });
  };

  // Geri alma / Silme
  const handleBackspace = () => {
    setAmountStr((prev) => {
      if (prev.length <= 1 || prev === '0') return '0';
      const updated = prev.slice(0, -1);
      return updated === '' ? '0' : updated;
    });
  };

  // Tutarı tamamen temizleme
  const handleClear = () => {
    setAmountStr('0');
  };

  // Sayısal tutara dönüştürme (Float)
  const getNumericAmount = (): number => {
    if (!amountStr || amountStr === '0') return 0;
    const normalized = amountStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const resetScroll = () => {
    if (typeof document !== 'undefined') {
      if (document.activeElement && (document.activeElement as HTMLElement).blur) {
        (document.activeElement as HTMLElement).blur();
      }
    }

    if (typeof window !== 'undefined') {
      const scrollClean = () => {
        try {
          window.scrollTo(0, 0);
          if (document.body) document.body.scrollTop = 0;
          if (document.documentElement) document.documentElement.scrollTop = 0;
          const root = document.getElementById('root');
          if (root) root.scrollTop = 0;
        } catch {}
      };

      scrollClean();
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(scrollClean);
      }
      setTimeout(scrollClean, 50);
      setTimeout(scrollClean, 150);
    }
  };

  // Ayarları kaydetme butonu aksiyonu
  const handleSaveSettings = async (newSettings: OdealSettings) => {
    setSettings(newSettings);
    const success = await saveSettings(newSettings);
    setIsSettingsOpen(false);
    resetScroll();
    if (success) {
      setToastMessage('✅ Ayarlar başarıyla kaydedildi!');
    } else {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
    }
  };

  // IBAN ve QR Ayarlarını Modal içinden kaydetme
  const handleSaveIbanQrSettings = async (newSettings: OdealSettings) => {
    setSettings(newSettings);
    const success = await saveSettings(newSettings);
    if (success) {
      setToastMessage('✅ IBAN ve QR Bilgileri Güncellendi!');
    }
  };

  // Hesap makinesinden hesaplanan tutarı kasaya aktar
  const handleApplyFromCalc = (calculatedAmount: number) => {
    const formatted = calculatedAmount.toString().replace('.', ',');
    setAmountStr(formatted);
    setToastMessage(`🧮 ${formatted} ₺ kasaya aktarıldı`);
    resetScroll();
  };

  // POS Makinesine Gönderme
  const handleSendToPos = async () => {
    const numericAmount = getNumericAmount();

    if (numericAmount <= 0) {
      Alert.alert('Geçersiz Tutar', "Lütfen 0 TL'den büyük bir tahsilat tutarı girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendBasketToOdeal({
        amount: numericAmount,
        settings,
      });

      setLastResult(result);
      setIsResultOpen(true);

      if (result.success && result.referenceCode) {
        setActiveReferenceCode(result.referenceCode);
        setAmountStr('0');
      }
    } catch (error: any) {
      Alert.alert('İşlem Başarısız', error?.message || 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // İşlemi POS'tan İptal Etme Aksiyonu
  const handleCancelTransaction = async (referenceCodeToCancel?: string) => {
    const refCode = referenceCodeToCancel || activeReferenceCode || lastResult?.referenceCode;

    if (!refCode) {
      Alert.alert('İptal Edilecek İşlem Yok', 'Şu anda POS üzerinde bekleyen aktif bir sepet veya işlem bulunmuyor.');
      return;
    }

    setIsCancelling(true);
    try {
      const cancelRes = await cancelActiveTransaction({
        referenceCode: refCode,
        settings,
      });

      if (cancelRes.success) {
        setActiveReferenceCode(null);
        setToastMessage('✅ İşlem POS cihazından iptal edildi');

        // Sonuç modalı açıksa durumunu 'CANCELLED' olarak güncelle
        setLastResult((prev) =>
          prev
            ? {
                ...prev,
                success: false,
                statusType: 'CANCELLED',
                responseCode: 'CANCELLED',
                message: cancelRes.message,
              }
            : null
        );
      } else {
        Alert.alert('İptal Edilemedi', cancelRes.message);
      }
    } catch (err: any) {
      Alert.alert('İptal Hatası', err?.message || 'İşlem iptal edilemedi.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    await performLogout();
    setIsAuthenticated(false);
    setIsSettingsOpen(false);
    resetScroll();
  };

  // Oturum kontrol ediliyor (Açılışta titremeyi ve ani parlamayı önler)
  if (isAuthenticated === null) {
    return (
      <View style={styles.splashLoadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  // Oturum kapalıysa Giriş Ekranını göster
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const numericAmount = getNumericAmount();
  const isSendDisabled = numericAmount <= 0 || isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mainWrapper}>
          {/* Header - Logo Üstte, Butonlar Altta (Büyük & Tam Responsive) */}
          <View style={[styles.header, (isShortScreen || isNarrowScreen) && styles.headerCompact]}>
            {/* Üst Kısım: Logo & Marka Başlığı & İmza */}
            <View style={styles.headerTopRow}>
              <View style={[styles.logoBadge, (isShortScreen || isNarrowScreen) && styles.logoBadgeCompact]}>
                <AppIcon
                  name="fish"
                  size={isShortScreen || isNarrowScreen ? 22 : 26}
                  color="#38BDF8"
                />
              </View>
              <View style={styles.brandTextContainer}>
                <Text
                  style={[
                    styles.brandTitle,
                    (isShortScreen || isNarrowScreen) && styles.brandTitleCompact,
                  ]}
                  numberOfLines={1}
                >
                  Ferhat Balıkçılık
                </Text>
                <Text style={styles.brandSignature} numberOfLines={1}>
                  by berat şahin
                </Text>
              </View>
            </View>

            {/* Alt Kısım: Büyük ve Rahat Dokunmatik Aksiyon Butonları */}
            <View style={styles.headerButtonsRow}>
              {/* IBAN / Karekod Butonu (Geniş, Büyük, Sadece "IBAN / Karekod") */}
              <TouchableOpacity
                style={[
                  styles.ibanQrBigBtn,
                  (isShortScreen || isNarrowScreen) && styles.ibanQrBigBtnCompact,
                ]}
                onPress={() => setIsIbanQrOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="IBAN / Karekod"
              >
                <AppIcon name="qr-code" size={18} color="#059669" />
                <Text style={styles.ibanQrBigBtnText}>IBAN / Karekod</Text>
              </TouchableOpacity>

              {/* Hesap Makinesi Butonu (Sadece İkon, Büyük) */}
              <TouchableOpacity
                style={[
                  styles.actionIconBigBtn,
                  (isShortScreen || isNarrowScreen) && styles.actionIconBigBtnCompact,
                ]}
                onPress={() => setIsCalcOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="Hesap Makinesi"
              >
                <AppIcon name="calculator" size={20} color="#0284C7" />
              </TouchableOpacity>

              {/* Ayarlar Butonu (Sadece İkon, Büyük) */}
              <TouchableOpacity
                style={[
                  styles.actionIconBigBtn,
                  (isShortScreen || isNarrowScreen) && styles.actionIconBigBtnCompact,
                ]}
                onPress={() => setIsSettingsOpen(true)}
                activeOpacity={0.7}
                accessibilityLabel="Sistem ve Fiş Ayarları"
              >
                <AppIcon name="settings" size={20} color="#0284C7" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Başarı / Bilgi Bildirim Toast'ı */}
          {toastMessage && (
            <View style={styles.toastContainer}>
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* Info Badges (Sabit Ürün, KDV ve POS Durumu) */}
          <InfoBadges
            settings={settings}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          {/* Amount Display */}
          <View style={styles.displaySection}>
            <AmountDisplay amountStr={amountStr} onClear={handleClear} />

            {/* Hızlı Hesap Makinesi Kısayol Barı */}
            <TouchableOpacity
              style={[styles.quickCalcBar, isShortScreen && styles.quickCalcBarCompact]}
              onPress={() => setIsCalcOpen(true)}
              activeOpacity={0.7}
            >
              <AppIcon name="calculator" size={14} color="#0284C7" />
              <Text style={styles.quickCalcText}>
                Tartı / Kilo × Fiyat Hesabı Yap
              </Text>
            </TouchableOpacity>
          </View>

          {/* Numpad Section */}
          <View style={styles.numpadSection}>
            <Numpad onKeyPress={handleKeyPress} onBackspace={handleBackspace} />

            {/* Action Buttons: POS'a Gönder & İşlemi İptal Et */}
            <View style={[styles.actionContainer, isShortScreen && styles.actionContainerCompact]}>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  isSendDisabled && styles.sendButtonDisabled,
                  isShortScreen && styles.sendButtonCompact,
                ]}
                onPress={handleSendToPos}
                disabled={isSendDisabled}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.sendButtonText}>Ödeal POS'a İletiliyor...</Text>
                  </View>
                ) : (
                  <View style={styles.sendButtonContent}>
                    <AppIcon name="send" size={isShortScreen ? 18 : 20} color="#FFFFFF" />
                    <Text style={[styles.sendButtonText, isShortScreen && styles.sendButtonTextCompact]}>
                      Ödeal POS'a Gönder
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Aktif veya Son İşlem Varsa: İşlemi POS'tan İptal Et Butonu */}
              {activeReferenceCode && (
                <TouchableOpacity
                  style={[styles.cancelActionButton, isCancelling && styles.cancelButtonDisabled]}
                  onPress={() => handleCancelTransaction()}
                  disabled={isCancelling}
                  activeOpacity={0.7}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <View style={styles.cancelBtnContent}>
                      <AppIcon name="x-circle" size={16} color="#DC2626" />
                      <Text style={styles.cancelActionText}>
                        İşlemi İptal Et (POS'tan Temizle)
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Hesap Makinesi Modalı */}
      <CalculatorModal
        visible={isCalcOpen}
        onClose={() => {
          setIsCalcOpen(false);
          resetScroll();
        }}
        onApplyAmount={handleApplyFromCalc}
      />

      {/* IBAN & QR Modalı */}
      <IbanQrModal
        visible={isIbanQrOpen}
        settings={settings}
        amount={numericAmount}
        onSaveSettings={handleSaveIbanQrSettings}
        onClose={() => {
          setIsIbanQrOpen(false);
          resetScroll();
        }}
      />

      {/* Settings Modal (Ayarları Kaydet Butonlu) */}
      <SettingsModal
        visible={isSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => {
          setIsSettingsOpen(false);
          resetScroll();
        }}
        onLogout={handleLogout}
      />

      {/* Result Modal (Gelişmiş Hata, Yetersiz Bakiye ve İptal Yönetimi) */}
      <ResultModal
        visible={isResultOpen}
        result={lastResult}
        onClose={() => {
          setIsResultOpen(false);
          resetScroll();
        }}
        onCancelTransaction={handleCancelTransaction}
        onOpenIbanQr={() => {
          setIsResultOpen(false);
          setIsIbanQrOpen(true);
        }}
        isCancelling={isCancelling}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashLoadingContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#0B132B',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    alignItems: 'center',
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    minHeight: '100%',
    backgroundColor: '#F8FAFC',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
  },
  header: {
    flexDirection: 'column',
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 11,
    gap: 9,
    width: '100%',
  },
  headerCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 7,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  logoBadgeCompact: {
    width: 35,
    height: 35,
    borderRadius: 10,
  },
  brandTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  brandTitleCompact: {
    fontSize: 15,
  },
  brandSignature: {
    fontSize: 13,
    color: '#38BDF8',
    fontStyle: 'italic',
    fontWeight: '600',
    letterSpacing: 0.6,
    fontFamily: Platform.select({
      web: '"Caveat", "Dancing Script", "Brush Script MT", "Segoe Script", cursive',
      ios: 'Snell Roundhand',
      default: 'normal',
    }),
    opacity: 0.95,
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  ibanQrBigBtn: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ibanQrBigBtnCompact: {
    height: 40,
  },
  ibanQrBigBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.2,
  },
  actionIconBigBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBigBtnCompact: {
    width: 40,
    height: 40,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#6EE7B7',
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  displaySection: {
    justifyContent: 'center',
  },
  quickCalcBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingVertical: 5,
    marginHorizontal: 16,
    marginTop: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  quickCalcBarCompact: {
    paddingVertical: 3,
    marginTop: 1,
  },
  quickCalcText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  numpadSection: {
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  actionContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 6,
  },
  actionContainerCompact: {
    paddingTop: 2,
    gap: 4,
  },
  sendButton: {
    backgroundColor: '#0284C7',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  sendButtonCompact: {
    height: 45,
    borderRadius: 13,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sendButtonTextCompact: {
    fontSize: 14,
  },
  cancelActionButton: {
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelActionText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
