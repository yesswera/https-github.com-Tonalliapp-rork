import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Ingresa email y contraseña');
      return;
    }
    try {
      await login({ email: email.trim(), password });
      router.replace('/(restaurant)/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      Alert.alert('Error', message);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, isTablet && styles.scrollTablet]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.logo}>TONALLI</Text>
              <View style={styles.divider} />
              <Text style={styles.subtitle}>Panel de Restaurante</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.title}>Iniciar Sesión</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor={Colors.silverDark}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="login-email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.silverDark}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    testID="login-password"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(!showPass)}
                  >
                    {showPass ? (
                      <EyeOff size={18} color={Colors.silverDark} />
                    ) : (
                      <Eye size={18} color={Colors.silverDark} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <GoldButton
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={loginLoading}
                disabled={!email.trim() || !password.trim()}
                style={{ marginTop: 8 }}
              />

              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>
                  ¿No tienes cuenta?{' '}
                  <Text style={styles.linkAccent}>Registra tu restaurante</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  scrollTablet: {
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 32,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 8,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: Colors.jadeMuted,
    marginVertical: 12,
    opacity: 0.5,
  },
  subtitle: {
    color: Colors.silverMuted,
    fontSize: 12,
    letterSpacing: 2,
  },
  form: {
    gap: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '300' as const,
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    color: Colors.goldMuted,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 15,
  },
  passwordRow: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: Colors.silverMuted,
    fontSize: 13,
  },
  linkAccent: {
    color: Colors.gold,
    fontWeight: '500' as const,
  },
});
