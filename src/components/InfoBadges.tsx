import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppIcon } from './AppIcon';
import { OdealSettings } from '../types/odeal';

interface InfoBadgesProps {
  settings: OdealSettings;
  onOpenSettings: () => void;
}

export const InfoBadges: React.FC<InfoBadgesProps> = ({ settings, onOpenSettings }) => {
  const { height } = useWindowDimensions();
  const isCompact = height < 680;

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <TouchableOpacity
        style={[styles.badge, isCompact && styles.badgeCompact]}
        onPress={onOpenSettings}
        activeOpacity={0.7}
      >
        <AppIcon name="tag" size={isCompact ? 11 : 13} color="#0284C7" />
        <Text style={styles.badgeLabel}>Ürün:</Text>
        <Text style={styles.badgeValue} numberOfLines={1}>
          {settings.productName || 'Genel Satış'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.badge, isCompact && styles.badgeCompact]}
        onPress={onOpenSettings}
        activeOpacity={0.7}
      >
        <AppIcon name="percent" size={isCompact ? 11 : 13} color="#059669" />
        <Text style={styles.badgeLabel}>KDV:</Text>
        <Text style={styles.badgeValue}>%{settings.vatRate}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.badge,
          isCompact && styles.badgeCompact,
          settings.isMockMode
            ? styles.badgeMock
            : settings.externalDeviceKey
            ? styles.badgeLive
            : styles.badgeWarning,
        ]}
        onPress={onOpenSettings}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.dot,
            {
              backgroundColor: settings.isMockMode
                ? '#F59E0B'
                : settings.externalDeviceKey
                ? '#10B981'
                : '#EF4444',
            },
          ]}
        />
        <Text style={styles.badgeValue} numberOfLines={1}>
          {settings.isMockMode
            ? 'Simülasyon'
            : settings.externalDeviceKey
            ? `POS: ${settings.externalDeviceKey}`
            : 'POS Tanımsız'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  containerCompact: {
    paddingVertical: 4,
    gap: 5,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 0,
  },
  badgeCompact: {
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  badgeMock: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  badgeLive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeLabel: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 3,
    fontWeight: '600',
  },
  badgeValue: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
    flexShrink: 1,
  },
});
