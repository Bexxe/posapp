import React, { useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from './AppIcon';
import * as Haptics from 'expo-haptics';

interface CalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyAmount: (amount: number) => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({
  visible,
  onClose,
  onApplyAmount,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const isShortScreen = windowHeight < 680;

  const [display, setDisplay] = useState<string>('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [historyText, setHistoryText] = useState<string>('');

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        // ignore
      }
    }
  };

  const handleDigit = (digit: string) => {
    triggerHaptic();
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      if (display === '0') {
        setDisplay(digit);
      } else {
        if (display.length > 10) return;
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    triggerHaptic();
    if (waitingForOperand) {
      setDisplay('0,');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(',')) {
      setDisplay(display + ',');
    }
  };

  const parseDisplay = (str: string): number => {
    const normalized = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const formatNumber = (num: number): string => {
    const rounded = Math.round(num * 100) / 100;
    return rounded.toString().replace('.', ',');
  };

  const handleOperator = (nextOp: string) => {
    triggerHaptic();
    const inputValue = parseDisplay(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistoryText(`${display} ${nextOp}`);
    } else if (operator) {
      const currentValue = prevValue;
      let result = currentValue;

      if (operator === '+') result = currentValue + inputValue;
      else if (operator === '-') result = currentValue - inputValue;
      else if (operator === '×') result = currentValue * inputValue;
      else if (operator === '÷') result = inputValue !== 0 ? currentValue / inputValue : 0;

      const formatted = formatNumber(result);
      setDisplay(formatted);
      setPrevValue(result);
      setHistoryText(`${formatted} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setOperator(nextOp);
  };

  const handleEquals = () => {
    triggerHaptic();
    const inputValue = parseDisplay(display);

    if (prevValue !== null && operator) {
      let result = prevValue;

      if (operator === '+') result = prevValue + inputValue;
      else if (operator === '-') result = prevValue - inputValue;
      else if (operator === '×') result = prevValue * inputValue;
      else if (operator === '÷') result = inputValue !== 0 ? prevValue / inputValue : 0;

      const formatted = formatNumber(result);
      setHistoryText(`${formatNumber(prevValue)} ${operator} ${display} =`);
      setDisplay(formatted);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    triggerHaptic();
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistoryText('');
  };

  const handleBackspace = () => {
    triggerHaptic();
    if (waitingForOperand) return;
    if (display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleApplyToPos = () => {
    triggerHaptic();
    let finalVal = parseDisplay(display);
    if (prevValue !== null && operator) {
      if (operator === '+') finalVal = prevValue + finalVal;
      else if (operator === '-') finalVal = prevValue - finalVal;
      else if (operator === '×') finalVal = prevValue * finalVal;
      else if (operator === '÷') finalVal = finalVal !== 0 ? prevValue / finalVal : 0;
    }
    onApplyAmount(Math.max(0, Number(finalVal.toFixed(2))));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <View style={styles.mainWrapper}>
          {/* Header */}
          <View style={[styles.header, isShortScreen && styles.headerCompact]}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityLabel="Kapat"
            >
              <AppIcon name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <View style={styles.calcIconBadge}>
                <AppIcon name="calculator" size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Hesap Makinesi</Text>
                <Text style={styles.headerSubtitle}>Tartı / Kilo × Fiyat Hesabı</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearBtn}
              activeOpacity={0.7}
              accessibilityLabel="Tümünü Temizle"
            >
              <Text style={styles.clearBtnText}>Sıfırla</Text>
            </TouchableOpacity>
          </View>

          {/* Calculator Screen / Display Section */}
          <View style={[styles.screen, isShortScreen && styles.screenCompact]}>
            <Text style={styles.historyText} numberOfLines={1}>
              {historyText || ' '}
            </Text>
            <View style={styles.displayRow}>
              <Text style={[styles.displayText, isShortScreen && styles.displayTextCompact]} numberOfLines={1} adjustsFontSizeToFit>
                {display}
              </Text>
              <Text style={styles.currencySymbol}>₺</Text>
            </View>
          </View>

          {/* Keypad - Tam Ekran Esnek Tuş Takımı */}
          <View style={styles.keypad}>
            {/* Satır 1 */}
            <View style={styles.row}>
              <TouchableOpacity style={[styles.btn, styles.btnFunc]} onPress={handleClear} activeOpacity={0.7}>
                <Text style={styles.btnFuncText}>C</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnFunc]} onPress={handleBackspace} activeOpacity={0.7}>
                <AppIcon name="delete" size={22} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnOp, operator === '÷' && styles.btnOpActive]}
                onPress={() => handleOperator('÷')}
                activeOpacity={0.7}
              >
                <Text style={styles.btnOpText}>÷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnOp, operator === '×' && styles.btnOpActive]}
                onPress={() => handleOperator('×')}
                activeOpacity={0.7}
              >
                <Text style={styles.btnOpText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Satır 2 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('7')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('8')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('9')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>9</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnOp, operator === '-' && styles.btnOpActive]}
                onPress={() => handleOperator('-')}
                activeOpacity={0.7}
              >
                <Text style={styles.btnOpText}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Satır 3 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('4')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('5')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('6')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>6</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnOp, operator === '+' && styles.btnOpActive]}
                onPress={() => handleOperator('+')}
                activeOpacity={0.7}
              >
                <Text style={styles.btnOpText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Satır 4 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('1')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('2')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('3')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnEqual]} onPress={handleEquals} activeOpacity={0.8}>
                <Text style={styles.btnEqualText}>=</Text>
              </TouchableOpacity>
            </View>

            {/* Satır 5 */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('0')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => handleDigit('00')} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>00</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={handleDecimal} activeOpacity={0.7}>
                <Text style={styles.btnNumText}>,</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnEqual]} onPress={handleEquals} activeOpacity={0.8}>
                <AppIcon name="check" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action: Kasaya Aktar Butonu */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyToPos} activeOpacity={0.85}>
              <AppIcon name="credit-card" size={22} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>
                Tutarı Kasaya Aktar ({display} ₺)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B132B',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerCompact: {
    paddingVertical: 6,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calcIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  screen: {
    backgroundColor: '#030712',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  screenCompact: {
    paddingVertical: 10,
    marginVertical: 6,
  },
  historyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    minHeight: 20,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  displayText: {
    color: '#38BDF8',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  displayTextCompact: {
    fontSize: 32,
  },
  currencySymbol: {
    color: '#38BDF8',
    fontSize: 24,
    fontWeight: '800',
  },
  keypad: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 6,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnNumText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  btnFunc: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  btnFuncText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EF4444',
  },
  btnOp: {
    backgroundColor: '#0284C7',
    borderColor: '#0369A1',
  },
  btnOpActive: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  btnOpText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnEqual: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  btnEqualText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  footer: {
    paddingTop: 8,
  },
  applyBtn: {
    backgroundColor: '#059669',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
