import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { performLogin } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isSmallScreen = windowHeight < 680 || windowWidth < 380;

  const [username, setUsername] = useState('ferhatbalıkçılık');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await performLogin(username, password, rememberMe);
      if (res.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(res.error || 'Giriş başarısız!');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Giriş yapılırken bir hata meydana geldi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isSmallScreen && styles.cardCompact]}>
            {/* Logo & Başlık Alanı */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <AppIcon name="fish" size={isSmallScreen ? 28 : 34} color="#38BDF8" />
              </View>
              <Text style={styles.brandTitle}>Ferhat Balıkçılık</Text>
              <Text style={styles.brandSignature}>by berat şahin</Text>
              <View style={styles.badgeTag}>
                <AppIcon name="lock" size={13} color="#0284C7" />
                <Text style={styles.badgeText}>Güvenli POS Giriş Paneli</Text>
              </View>
            </View>

            {/* Hata Mesajı Alanı */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AppIcon name="alert-triangle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Form Alanı */}
            <View style={styles.form}>
              {/* Kullanıcı Adı */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kullanıcı Adı</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <AppIcon name="user" size={18} color="#64748B" />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Kullanıcı adınızı girin"
                    placeholderTextColor="#64748B"
                    value={username}
                    onChangeText={(val) => {
                      setUsername(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Şifre */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Şifre</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <AppIcon name="lock" size={18} color="#64748B" />
                  </View>
                  <TextInput
                    style={[styles.textInput, { paddingRight: 42 }]}
                    placeholder="Şifrenizi girin"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <AppIcon
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={18}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Beni Hatırla Seçeneği */}
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <AppIcon name="check" size={13} color="#FFFFFF" />}
                </View>
                <View style={styles.rememberTextGroup}>
                  <Text style={styles.rememberLabel}>Beni Hatırla</Text>
                  <Text style={styles.rememberSubtext}>
                    Tekrar şifre sormadan oturumu kalıcı açık tut
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Giriş Yap Butonu */}
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Giriş Yapılıyor...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <AppIcon name="check-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Sisteme Giriş Yap</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Alt Güvenlik Bilgisi */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerInfoText}>
                Ferhat Balıkçılık Kasa & Ödeal POS Entegrasyonu
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  cardCompact: {
    padding: 18,
    borderRadius: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  brandSignature: {
    fontFamily: Platform.OS === 'web' ? "'Dancing Script', cursive" : 'normal',
    fontSize: 16,
    fontWeight: '600',
    color: '#38BDF8',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  badgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A120',
    borderColor: '#0284C740',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF444415',
    borderColor: '#EF444450',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    position: 'relative',
  },
  inputIcon: {
    paddingLeft: 12,
    paddingRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 12 : 10,
    paddingRight: 12,
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  rememberTextGroup: {
    flex: 1,
  },
  rememberLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  rememberSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  loginButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerInfo: {
    marginTop: 22,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 14,
  },
  footerInfoText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});
