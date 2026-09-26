import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppIcon } from './AppIcon';
import { OdealSettings } from '../types/odeal';
import * as Haptics from 'expo-haptics';

interface IbanQrModalProps {
  visible: boolean;
  settings: OdealSettings;
  amount: number;
  onClose: () => void;
  onSaveSettings?: (newSettings: OdealSettings) => void;
}

export const IbanQrModal: React.FC<IbanQrModalProps> = ({
  visible,
  settings,
  amount,
  onClose,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'qr_upload' | 'edit'>('view');
  const [copied, setCopied] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Düzenleme formu durumları
  const [editTitle, setEditTitle] = useState(settings.ibanTitle || 'Ferhat Balıkçılık');
  const [editBank, setEditBank] = useState(settings.ibanBank || '');
  const [editIban, setEditIban] = useState(settings.ibanNumber || '');
  const [editQrData, setEditQrData] = useState(settings.qrCodeData || '');
  const [editQrImage, setEditQrImage] = useState<string>(settings.qrCodeImage || '');

  // Modal her açıldığında veya settings değiştiğinde formu senkronize et
  useEffect(() => {
    if (visible) {
      setEditTitle(settings.ibanTitle || 'Ferhat Balıkçılık');
      setEditBank(settings.ibanBank || '');
      setEditIban(settings.ibanNumber || '');
      setEditQrData(settings.qrCodeData || '');
      setEditQrImage(settings.qrCodeImage || '');
      setSaveSuccessMsg(null);
    }
  }, [visible, settings]);

  const ibanRaw = settings.ibanNumber?.replace(/\s/g, '') || '';
  const ibanFormatted = ibanRaw
    ? ibanRaw.replace(/(.{4})/g, '$1 ').trim()
    : 'IBAN Henüz Tanımlanmadı';

  // QR Kod Değeri (FAST Karekod formatı veya doğrudan IBAN / özel veri)
  const qrData =
    settings.qrCodeData?.trim() ||
    (ibanRaw
      ? `iban:${ibanRaw}?name=${encodeURIComponent(settings.ibanTitle || 'Ferhat Balıkçılık')}&amount=${amount}`
      : 'https://odeal.com');

  const currentQrImage = editQrImage || settings.qrCodeImage;

  const handleCopyIban = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ibanRaw);
    }

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  // Resim Yükleme Fonksiyonu (Web & Mobil Tarayıcılar)
  const handlePickQrImage = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          if (file.size > 8 * 1024 * 1024) {
            Alert.alert('Görsel Çok Büyük', "Lütfen 8MB'dan küçük bir karekod resmi seçin.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setEditQrImage(result);
              const updated = {
                ...settings,
                qrCodeImage: result,
              };
              if (onSaveSettings) {
                onSaveSettings(updated);
              }
              setSaveSuccessMsg('✅ Banka karekod resmi yüklendi ve kaydedildi!');
              setTimeout(() => {
                setSaveSuccessMsg(null);
                setActiveTab('view');
              }, 1200);
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  // Yüklenen Karekod Resmini Silme
  const handleRemoveQrImage = () => {
    setEditQrImage('');
    const updated = {
      ...settings,
      qrCodeImage: '',
    };
    if (onSaveSettings) {
      onSaveSettings(updated);
    }
    setSaveSuccessMsg('✅ Karekod resmi kaldırıldı. Standart FAST karekod aktif.');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setActiveTab('view');
    }, 1200);
  };

  // IBAN Bilgilerini Kaydetme
  const handleSaveEdit = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
    }

    const updatedSettings: OdealSettings = {
      ...settings,
      ibanTitle: editTitle.trim() || 'Ferhat Balıkçılık',
      ibanBank: editBank.trim(),
      ibanNumber: editIban.trim(),
      qrCodeData: editQrData.trim(),
      qrCodeImage: editQrImage,
    };

    if (onSaveSettings) {
      onSaveSettings(updatedSettings);
    }

    setSaveSuccessMsg('✅ IBAN ve Karekod bilgileri başarıyla güncellendi!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      setActiveTab('view');
    }, 1200);
  };

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.iconCircle}>
                  <AppIcon name="qr-code" size={20} color="#059669" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>IBAN & QR ile Ödeme</Text>
                  <Text style={styles.headerSubtitle}>FAST / Havale / Karekod Yönetimi</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} accessibilityLabel="Kapat">
                <AppIcon name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Segmented Tabs (3 Sekme: Görüntüle / QR Resmi Yükle / IBAN Düzenle) */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'view' && styles.tabButtonActive]}
                onPress={() => setActiveTab('view')}
                activeOpacity={0.7}
              >
                <AppIcon
                  name="qr-code"
                  size={14}
                  color={activeTab === 'view' ? '#059669' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'view' && styles.tabButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Karekod & IBAN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'qr_upload' && styles.tabButtonActive]}
                onPress={() => setActiveTab('qr_upload')}
                activeOpacity={0.7}
              >
                <AppIcon
                  name="image"
                  size={14}
                  color={activeTab === 'qr_upload' ? '#059669' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'qr_upload' && styles.tabButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  QR Resim Yükle
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'edit' && styles.tabButtonActive]}
                onPress={() => setActiveTab('edit')}
                activeOpacity={0.7}
              >
                <AppIcon
                  name="sliders"
                  size={14}
                  color={activeTab === 'edit' ? '#059669' : '#64748B'}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'edit' && styles.tabButtonTextActive,
                  ]}
                  numberOfLines={1}
                >
                  IBAN Bilgileri
                </Text>
              </TouchableOpacity>
            </View>

            {saveSuccessMsg && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>{saveSuccessMsg}</Text>
              </View>
            )}

            {activeTab === 'view' ? (
              /* ================== TAB 1: KAREKOD & IBAN GÖRÜNTÜLEME ================== */
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scroll}
              >
                {/* Tutar Göstergesi (Eğer kasada tutar varsa) */}
                {amount > 0 && (
                  <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>TAHSİL EDİLECEK TUTAR</Text>
                    <Text style={styles.amountValue}>
                      {amount.toLocaleString('tr-TR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      ₺
                    </Text>
                  </View>
                )}

                {/* QR Kod Kartı (Yüklenen Resim veya Otomatik FAST QR) */}
                <View style={styles.qrContainer}>
                  {currentQrImage ? (
                    /* YÜKLENEN ÖZEL BANKA KAREKOD RESMİ */
                    <View style={styles.uploadedQrBox}>
                      <View style={styles.uploadedBadge}>
                        <AppIcon name="check-circle" size={13} color="#059669" />
                        <Text style={styles.uploadedBadgeText}>Banka Karekod Görseli</Text>
                      </View>
                      <Image
                        source={{ uri: currentQrImage }}
                        style={styles.qrImagePreview}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrHint}>
                        📱 Müşteriniz bu karekodu mobil bankacılığından okutabilir
                      </Text>
                    </View>
                  ) : (
                    /* OTOMATİK FAST KAREKODU */
                    <View style={styles.generatedQrBox}>
                      <View style={styles.qrWrapper}>
                        <QRCode
                          value={qrData}
                          size={170}
                          color="#0F172A"
                          backgroundColor="#FFFFFF"
                        />
                      </View>
                      <Text style={styles.qrHint}>
                        📱 Müşteriniz mobil bankacılıktan "Karekod Oku" ile tarayabilir
                      </Text>
                    </View>
                  )}
                </View>

                {/* İşletme & IBAN Bilgileri */}
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hesap Sahibi:</Text>
                    <Text style={styles.infoValue}>
                      {settings.ibanTitle || 'Ferhat Balıkçılık'}
                    </Text>
                  </View>

                  {settings.ibanBank ? (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Banka:</Text>
                      <Text style={styles.infoValue}>{settings.ibanBank}</Text>
                    </View>
                  ) : null}

                  {/* IBAN Numarası ve Kopyala Butonu */}
                  <View style={styles.ibanContainer}>
                    <View style={styles.ibanHeader}>
                      <Text style={styles.ibanLabel}>IBAN NUMARASI</Text>
                      {copied && <Text style={styles.copiedBadge}>Kopyalandı! ✓</Text>}
                    </View>
                    <Text style={styles.ibanNumber} selectable>
                      {ibanFormatted}
                    </Text>

                    <TouchableOpacity
                      style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
                      onPress={handleCopyIban}
                      activeOpacity={0.8}
                    >
                      <AppIcon name={copied ? 'check' : 'copy'} size={16} color="#FFFFFF" />
                      <Text style={styles.copyBtnText}>
                        {copied ? 'IBAN Panoya Kopyalandı' : 'IBAN Numarasını Kopyala'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Doğrudan Düzenleme Kısayolu Butonu */}
                  <TouchableOpacity
                    style={styles.editShortcutBtn}
                    onPress={() => setActiveTab('edit')}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="sliders" size={15} color="#0284C7" />
                    <Text style={styles.editShortcutText}>
                      IBAN Bilgilerini Düzenle
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : activeTab === 'qr_upload' ? (
              /* ================== TAB 2: QR KOD RESMİ YÜKLEME EKRANI ================== */
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scroll}
              >
                <View style={styles.uploadCard}>
                  <View style={styles.uploadHeaderBox}>
                    <View style={styles.uploadIconCircle}>
                      <AppIcon name="image" size={22} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.uploadCardTitle}>Banka Karekod Resmi Yükle</Text>
                      <Text style={styles.uploadCardDesc}>
                        Banka mobil uygulamanızdan aldığınız karekod görselini veya ekran görüntüsünü yükleyin.
                      </Text>
                    </View>
                  </View>

                  {currentQrImage ? (
                    /* Mevcut Resim Önizleme ve Yönetim */
                    <View style={styles.currentImageWrapper}>
                      <View style={styles.imageFrame}>
                        <Image
                          source={{ uri: currentQrImage }}
                          style={styles.fullImagePreview}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.imageStatusRow}>
                        <AppIcon name="check-circle" size={16} color="#059669" />
                        <Text style={styles.imageStatusText}>
                          Karekod görseli yüklendi ve kasada gösteriliyor.
                        </Text>
                      </View>

                      <View style={styles.uploadActionButtons}>
                        <TouchableOpacity
                          style={styles.changeImageBtn}
                          onPress={handlePickQrImage}
                          activeOpacity={0.8}
                        >
                          <AppIcon name="upload" size={16} color="#FFFFFF" />
                          <Text style={styles.changeImageBtnText}>Yeni Resim Seç</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteImageBtn}
                          onPress={handleRemoveQrImage}
                          activeOpacity={0.8}
                        >
                          <AppIcon name="trash-2" size={16} color="#DC2626" />
                          <Text style={styles.deleteImageBtnText}>Resmi Kaldır</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    /* Boş Yükleme Alanı */
                    <View style={styles.dropzone}>
                      <View style={styles.dropzoneIconCircle}>
                        <AppIcon name="upload" size={32} color="#0284C7" />
                      </View>
                      <Text style={styles.dropzoneTitle}>Karekod Görselinizi Seçin</Text>
                      <Text style={styles.dropzoneSubtitle}>
                        Galeriden ekran görüntüsü (screenshot) seçebilir veya kamerayla fotoğrafını çekebilirsiniz.
                      </Text>
                      <TouchableOpacity
                        style={styles.selectFileBtn}
                        onPress={handlePickQrImage}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="upload" size={18} color="#FFFFFF" />
                        <Text style={styles.selectFileBtnText}>Resim / Fotoğraf Yükle</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Yardım ve Rehber Kutusu */}
                  <View style={styles.tipBox}>
                    <Text style={styles.tipTitle}>💡 Nasıl Kullanılır?</Text>
                    <Text style={styles.tipText}>
                      1. Ziraat, Garanti, İş Bankası vb. mobil bankacılığınıza girin.{'\n'}
                      2. "Karekod ile Ödeme Al / FAST Karekod" ekranını açın.{'\n'}
                      3. Ekran görüntüsü (screenshot) alın.{'\n'}
                      4. Buradaki <Text style={{ fontWeight: '700' }}>"Resim / Fotoğraf Yükle"</Text> butonuna basıp ekran görüntüsünü seçin.{'\n'}
                      5. Müşterileriniz doğrudan bankanızın karekodunu okuyacaktır!
                    </Text>
                  </View>
                </View>
              </ScrollView>
            ) : (
              /* ================== TAB 3: DÜZENLEME EKRANI (IBAN METİNLERİ) ================== */
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.scroll}
              >
                <View style={styles.editCard}>
                  <Text style={styles.editSectionTitle}>IBAN VE ALICI BİLGİLERİ</Text>

                  {/* 1. Hesap Sahibi / Alıcı Adı */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Hesap Sahibi / Alıcı Adı *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="Örn: Ferhat Balıkçılık"
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.inputHelper}>
                      Müşterinizin havale ekranında göreceği resmi alıcı adı.
                    </Text>
                  </View>

                  {/* 2. Banka Adı */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Banka Adı</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editBank}
                      onChangeText={setEditBank}
                      placeholder="Örn: Ziraat Bankası, Garanti BBVA"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* 3. IBAN Numarası */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>IBAN Numarası *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editIban}
                      onChangeText={setEditIban}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                    />
                    <Text style={styles.inputHelper}>
                      Ödemelerin geleceği 26 haneli TR IBAN numaranız.
                    </Text>
                  </View>

                  {/* 4. Özel QR Kod İçeriği / Linki */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Özel QR Metni / Bağlantısı (İsteğe Bağlı)</Text>
                    <TextInput
                      style={[styles.textInput, styles.textInputMultiline]}
                      value={editQrData}
                      onChangeText={setEditQrData}
                      placeholder="Boş bırakırsanız otomatik FAST karekodu üretilir"
                      placeholderTextColor="#94A3B8"
                      multiline
                      autoCapitalize="none"
                    />
                    <Text style={styles.inputHelper}>
                      Boş bırakırsanız otomatik FAST karekodu üretilir.
                    </Text>
                  </View>

                  {/* Kaydet Butonu */}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveEdit}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>IBAN Bilgilerini Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* Kapat Butonu */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.closeFullBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.closeFullBtnText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    maxWidth: 500,
    height: Platform.OS === 'web' ? '92%' : '92%',
    maxHeight: '94%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    flex: 1,
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#059669',
  },
  successBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 20,
  },
  amountCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38BDF8',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadedQrBox: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  uploadedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  qrImagePreview: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  generatedQrBox: {
    alignItems: 'center',
    width: '100%',
  },
  qrWrapper: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  qrHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
  },
  ibanContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ibanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ibanLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  copiedBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  ibanNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
  },
  copyBtnSuccess: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  editShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  editShortcutText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },

  /* TAB 2: RESİM YÜKLEME EKRANI STİLLERİ */
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
  },
  currentImageWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageFrame: {
    width: '100%',
    height: 240,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  fullImagePreview: {
    width: '100%',
    height: '100%',
  },
  imageStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 12,
  },
  imageStatusText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  uploadActionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  changeImageBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  changeImageBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteImageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteImageBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
  },
  dropzone: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  dropzoneIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropzoneTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  dropzoneSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  selectFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  selectFileBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  tipBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 17,
    fontWeight: '500',
  },

  /* TAB 3: DÜZENLEME EKRANI STİLLERİ */
  editCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  textInputMultiline: {
    height: 60,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  closeFullBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});
