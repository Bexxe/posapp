import React, { useState } from 'react';
import {
  Alert,
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
import { AppIcon } from './AppIcon';
import { OdealSettings } from '../types/odeal';

interface SettingsModalProps {
  visible: boolean;
  settings: OdealSettings;
  onSave: (newSettings: OdealSettings) => void;
  onClose: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  onSave,
  onClose,
  onLogout,
}) => {
  const [productName, setProductName] = useState(settings.productName || 'FerhatBalik');
  const [vatRate, setVatRate] = useState<number>(typeof settings.vatRate === 'number' ? settings.vatRate : 1);

  // Modal her açıldığında mevcut ayarları form ile senkronize et
  React.useEffect(() => {
    if (visible) {
      setProductName(settings.productName || 'FerhatBalik');
      setVatRate(typeof settings.vatRate === 'number' ? settings.vatRate : 1);
    }
  }, [visible, settings]);

  const handleSave = () => {
    const rawVat = typeof vatRate === 'number' ? vatRate : parseInt(String(vatRate), 10);
    const finalVat = isNaN(rawVat) ? 1 : rawVat;

    const validatedSettings: OdealSettings = {
      ...settings, // Sabit API anahtarları ve bağlantı ayarları korunur
      productName: productName.trim() || 'FerhatBalik',
      vatRate: finalVat,
    };

    onSave(validatedSettings);
  };

  const handleLogoutPress = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Oturumu kapatmak istediğinize emin misiniz? Tekrar giriş yapmanız gerekecektir.')) {
        onClose();
        onLogout?.();
      }
    } else {
      Alert.alert(
        'Oturumu Kapat',
        'Çıkış yapmak istediğinize emin misiniz? Tekrar giriş yapmanız gerekecektir.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Çıkış Yap',
            style: 'destructive',
            onPress: () => {
              onClose();
              onLogout?.();
            },
          },
        ]
      );
    }
  };

  const vatQuickRates = [1, 10, 20];

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
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                <View style={styles.headerIconCircle}>
                  <AppIcon name="sliders" size={18} color="#0284C7" />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    Satış & Fiş Ayarları
                  </Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    KDV Oranı ve Fiş Başlığı Yapılandırması
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleSave} style={styles.headerSaveBtn} activeOpacity={0.8}>
                  <AppIcon name="check" size={14} color="#FFFFFF" />
                  <Text style={styles.headerSaveBtnText}>Kaydet</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.headerCloseBtn} activeOpacity={0.7} accessibilityLabel="Kapat">
                  <AppIcon name="x" size={17} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={true}
            >
              {/* Bilgilendirme Notu */}
              <View style={styles.infoBox}>
                <AppIcon name="check-circle" size={16} color="#059669" />
                <Text style={styles.infoBoxText}>
                  Ödeal POS API ve cihaz bağlantısı uygulamanızda sabit olarak tanımlıdır.
                </Text>
              </View>

              {/* Fiş / Ürün Başlığı */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <AppIcon name="tag" size={16} color="#0284C7" />
                  <Text style={styles.sectionTitle}>FİŞ / ÜRÜN BAŞLIĞI</Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sabit Fiş Başlığı (Ürün Adı)</Text>
                  <TextInput
                    style={styles.input}
                    value={productName}
                    onChangeText={setProductName}
                    placeholder="Örn: FerhatBalik veya Taze Balık"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.helperText}>
                    Ödeal POS fişinde ve sepet satırında görünecek ürün adıdır.
                  </Text>
                </View>
              </View>

              {/* KDV Oranı Ayarı */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <AppIcon name="percent" size={16} color="#059669" />
                  <Text style={styles.sectionTitle}>KDV ORANI (%)</Text>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Uygulanacak KDV Oranı</Text>
                  <View style={styles.vatRow}>
                    {vatQuickRates.map((rate) => (
                      <TouchableOpacity
                        key={rate}
                        style={[
                          styles.vatChip,
                          vatRate === rate && styles.vatChipActive,
                        ]}
                        onPress={() => setVatRate(rate)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.vatChipText,
                            vatRate === rate && styles.vatChipTextActive,
                          ]}
                        >
                          %{rate}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TextInput
                      style={[styles.input, styles.vatInput]}
                      value={vatRate?.toString()}
                      onChangeText={(txt) => {
                        const parsed = parseInt(txt, 10);
                        setVatRate(isNaN(parsed) ? 0 : parsed);
                      }}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="Özel %"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <Text style={styles.helperText}>
                    Balık ve temel gıda satışlarında KDV genellikle %1'dir.
                  </Text>
                </View>

                {/* Güvenlik & Oturum Bölümü */}
                {onLogout && (
                  <View style={styles.logoutSection}>
                    <View style={styles.sectionHeaderRow}>
                      <AppIcon name="lock" size={16} color="#64748B" />
                      <Text style={styles.sectionTitle}>Giriş & Güvenlik</Text>
                    </View>
                    <View style={styles.sessionCard}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionUserTitle}>Giriş Yapan Kullanıcı</Text>
                        <Text style={styles.sessionUser}>ferhatbalıkçılık</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.logoutBtn}
                        onPress={handleLogoutPress}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="log-out" size={16} color="#DC2626" />
                        <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <AppIcon name="check" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Ayarları Kaydet</Text>
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
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    height: Platform.OS === 'web' ? 'auto' : undefined,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    width: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  headerSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  headerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  infoBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
  section: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  vatRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  vatChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  vatChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  vatChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  vatChipTextActive: {
    color: '#FFFFFF',
  },
  vatInput: {
    flex: 1.2,
    textAlign: 'center',
    paddingVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    flexShrink: 0,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutSection: {
    marginTop: 6,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sessionInfo: {
    gap: 2,
  },
  sessionUserTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  sessionUser: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
