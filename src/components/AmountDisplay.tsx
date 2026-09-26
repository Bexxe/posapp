import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppIcon } from './AppIcon';

interface AmountDisplayProps {
  amountStr: string;
  onClear: () => void;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({ amountStr, onClear }) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 680;
  const isVeryCompact = height < 600;

  // Format string for Turkish Lira representation
  const formatDisplay = (raw: string) => {
    if (!raw || raw === '0') return '0,00';

    const parts = raw.split(',');
    let intPart = parts[0] || '0';
    let decPart = parts.length > 1 ? parts[1] : '';

    // Add thousands separators (dots)
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (parts.length > 1) {
      return `${intPart},${decPart}`;
    }
    return intPart;
  };

  const displayText = formatDisplay(amountStr);
  const isZero = !amountStr || amountStr === '0';

  return (
    <View
      style={[
        styles.card,
        isCompact && styles.cardCompact,
        isVeryCompact && styles.cardVeryCompact,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.subtitle}>TAHSİLAT TUTARI</Text>
        {!isZero && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <View style={styles.clearBtn}>
              <AppIcon name="trash-2" size={12} color="#EF4444" />
              <Text style={styles.clearText}>Temizle</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.currencySymbol,
            isCompact && styles.currencySymbolCompact,
            isZero && styles.currencySymbolInactive,
          ]}
        >
          ₺
        </Text>
        <Text
          style={[
            styles.amountText,
            isCompact && styles.amountTextCompact,
            isZero && styles.amountTextInactive,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {displayText}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  cardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginVertical: 2,
  },
  cardVeryCompact: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  clearText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: '#38BDF8',
    marginRight: 6,
  },
  currencySymbolCompact: {
    fontSize: 24,
    marginRight: 4,
  },
  currencySymbolInactive: {
    color: '#475569',
  },
  amountText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  amountTextCompact: {
    fontSize: 36,
  },
  amountTextInactive: {
    color: '#475569',
  },
});
