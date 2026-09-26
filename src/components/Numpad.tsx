import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppIcon } from './AppIcon';
import * as Haptics from 'expo-haptics';

interface NumpadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

export const Numpad: React.FC<NumpadProps> = ({ onKeyPress, onBackspace }) => {
  const { height } = useWindowDimensions();
  const isVeryShort = height < 620;
  const isShort = height < 700;

  const keyHeight = isVeryShort ? 40 : isShort ? 44 : 50;
  const keyFontSize = isVeryShort ? 19 : 22;
  const rowMargin = isVeryShort ? 4 : 6;
  const keyRadius = isVeryShort ? 10 : 13;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
  };

  const handlePress = (val: string) => {
    triggerHaptic();
    onKeyPress(val);
  };

  const handleBackspace = () => {
    triggerHaptic();
    onBackspace();
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [',', '0', 'backspace'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.row, { marginBottom: rowMargin }]}>
          {row.map((btn) => {
            if (btn === 'backspace') {
              return (
                <TouchableOpacity
                  key="btn-backspace"
                  style={[
                    styles.keyButton,
                    styles.backspaceButton,
                    { height: keyHeight, borderRadius: keyRadius },
                  ]}
                  onPress={handleBackspace}
                  activeOpacity={0.6}
                >
                  <AppIcon name="delete" size={isVeryShort ? 20 : 23} color="#EF4444" />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={`btn-${btn}`}
                style={[styles.keyButton, { height: keyHeight, borderRadius: keyRadius }]}
                onPress={() => handlePress(btn)}
                activeOpacity={0.5}
              >
                <Text style={[styles.keyText, { fontSize: keyFontSize }]}>{btn}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 2,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keyButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backspaceButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  keyText: {
    fontWeight: '700',
    color: '#0F172A',
  },
});
