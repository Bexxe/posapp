import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { OdealTransactionResult } from '../types/odeal';

interface ResultModalProps {
  visible: boolean;
  result: OdealTransactionResult | null;
  onClose: () => void;
  onCancelTransaction?: (referenceCode: string) => Promise<void>;
  onOpenIbanQr?: () => void;
  isCancelling?: boolean;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  visible,
  result,
  onClose,
  onCancelTransaction,
  onOpenIbanQr,
  isCancelling = false,
}) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 680;

  if (!result) return null;

  const isSuccess = result.success;
  const statusType = result.statusType || (isSuccess ? 'SUCCESS' : 'ERROR');

  // Tema ve İkon Belirleme
  let themeColor = '#10B981'; // Green
  let themeBg = '#ECFDF5';
  let themeBorder = '#A7F3D0';
  let title = 'POS İletimi Başarılı';
  let iconName = 'check-circle';

  if (statusType === 'INSUFFICIENT_FUNDS') {
    themeColor = '#D97706'; // Amber / Orange
    themeBg = '#FFFBEB';
    themeBorder = '#FDE68A';
    title = 'Yetersiz Bakiye';
    iconName = 'alert-triangle';
  } else if (statusType === 'CANCELLED') {
    themeColor = '#475569'; // Slate
    themeBg = '#F1F5F9';
    themeBorder = '#CBD5E1';
    title = 'İşlem İptal Edildi';
    iconName = 'x-circle';
  } else if (!isSuccess) {
    themeColor = '#EF4444'; // Red
    themeBg = '#FEF2F2';
    themeBorder = '#FECACA';
    title = statusType === 'DECLINED' ? 'Kart / Banka Reddi' : 'İşlem Başarısız';
    iconName = 'alert-triangle';
  }

  const handleCancel = () => {
    if (result.referenceCode && onCancelTransaction) {
      onCancelTransaction(result.referenceCode);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, isCompact && styles.cardCompact]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Status Icon */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: themeBg, borderColor: themeBorder },
                isCompact && styles.iconCircleCompact,
              ]}
            >
              <AppIcon
                name={iconName}
                size={isCompact ? 36 : 44}
                color={themeColor}
              />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: themeColor }, isCompact && styles.titleCompact]}>
              {title}
            </Text>

            {/* Status Badge */}
            {result.responseCode && (
              <View style={[styles.codeBadge, { backgroundColor: themeBg, borderColor: themeBorder }]}>
                <Text style={[styles.codeBadgeText, { color: themeColor }]}>
                  {result.responseCode === '00' ? 'ONAY: 00' : `KOD: ${result.responseCode}`}
                </Text>
              </View>
            )}

            {/* Message Description */}
            <View
              style={[
                styles.messageCard,
                { backgroundColor: themeBg, borderColor: themeBorder },
              ]}
            >
              <Text style={[styles.message, { color: themeColor === '#10B981' ? '#166534' : themeColor === '#D97706' ? '#92400E' : themeColor === '#475569' ? '#334155' : '#991B1B' }]}>
                {result.message}
              </Text>
            </View>

            {/* Yetersiz Bakiye Özel Yönlendirme Kartı */}
            {statusType === 'INSUFFICIENT_FUNDS' && (
              <View style={styles.alternativeCard}>
                <View style={styles.altHeader}>
                  <AppIcon name="credit-card" size={16} color="#D97706" />
                  <Text style={styles.altTitle}>Alternatif Tahsilat Yolu</Text>
                </View>
                <Text style={styles.altText}>
                  Müşterinin kart limiti yetersiz olduğu için tahsilat tamamlanamadı. Farklı bir kart isteyebilir veya hemen IBAN/Karekod ile ödeme alabilirsiniz.
                </Text>
                {onOpenIbanQr && (
                  <TouchableOpacity
                    style={styles.ibanQrActionBtn}
                    onPress={() => {
                      onClose();
                      onOpenIbanQr();
                    }}
                    activeOpacity={0.8}
                  >
                    <AppIcon name="qr-code" size={16} color="#047857" />
                    <Text style={styles.ibanQrActionText}>IBAN / QR Ekranını Aç</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Details Box */}
            <View style={[styles.detailsBox, isCompact && styles.detailsBoxCompact]}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tutar:</Text>
                <Text style={styles.detailValueBold}>
                  {result.amount.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  ₺
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ürün Adı:</Text>
                <Text style={styles.detailValue}>{result.productName}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>KDV Oranı:</Text>
                <Text style={styles.detailValue}>%{result.vatRate}</Text>
              </View>

              {result.referenceCode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Referans Kodu:</Text>
                  <Text style={styles.detailValueCode}>{result.referenceCode}</Text>
                </View>
              )}

              {result.basketId && result.basketId !== result.referenceCode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sepet ID:</Text>
                  <Text style={styles.detailValueCode}>{result.basketId}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Saat:</Text>
                <Text style={styles.detailValue}>{result.timestamp}</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              {/* POS İletimi Başarılı iken: İşlemi İptal Et Butonu */}
              {isSuccess && result.referenceCode && onCancelTransaction && (
                <TouchableOpacity
                  style={[styles.cancelBtn, isCancelling && styles.btnDisabled]}
                  onPress={handleCancel}
                  disabled={isCancelling}
                  activeOpacity={0.7}
                >
                  {isCancelling ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <>
                      <AppIcon name="x-circle" size={17} color="#DC2626" />
                      <Text style={styles.cancelBtnText}>İşlemi POS'tan İptal Et</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Ana Kapat / Yeni Satış Butonu */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: isSuccess ? '#10B981' : '#0F172A' },
                  isCompact && styles.buttonCompact,
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>
                  {isSuccess
                    ? 'Yeni Satış Başlat'
                    : statusType === 'CANCELLED'
                    ? 'Yeni Satışa Dön'
                    : 'Kapat ve Tekrar Dene'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  cardCompact: {
    padding: 14,
    borderRadius: 18,
    maxHeight: '96%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  iconCircleCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 17,
    marginBottom: 4,
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  codeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  messageCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '600',
  },
  alternativeCard: {
    width: '100%',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  altHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  altTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  altText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    fontWeight: '500',
    marginBottom: 8,
  },
  ibanQrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  ibanQrActionText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '700',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 7,
  },
  detailsBoxCompact: {
    padding: 10,
    marginBottom: 12,
    gap: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  detailValueBold: {
    fontSize: 16,
    color: '#0284C7',
    fontWeight: '800',
  },
  detailValueCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0F172A',
    fontWeight: '700',
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  cancelBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
