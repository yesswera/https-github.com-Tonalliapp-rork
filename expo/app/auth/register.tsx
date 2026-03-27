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
import Colors from '@/constants/colors';
import GoldButton from '@/components/GoldButton';
import { useAuth } from '@/providers/AuthProvider';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, registerLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleRegister = async () => {
    if (!restaurantName.trim() || !ownerName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }
    try {
      await register({
        restaurantName: restaurantName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
      });
      router.replace('/(restaurant)/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al registrar';
      Alert.alert('Error', message);
    }
  };

  const isValid = restaurantName.trim() && ownerName.trim() && email.trim() && password.trim();

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
              <Text style={styles.subtitle}>Registra tu restaurante</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE DEL RESTAURANTE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="La Cocina de María"
                  placeholderTextColor={Colors.silverDark}
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  testID="register-restaurant"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TU NOMBRE *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Carlos Valenzuela"
                  placeholderTextColor={Colors.silverDark}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  testID="register-name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>EMAIL *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor={Colors.silverDark}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-email"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTRASEÑA *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={Colors.silverDark}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  testID="register-password"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>TELÉFONO</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3221234567"
                  placeholderTextColor={Colors.silverDark}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DIRECCIÓN</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ciudad, Estado, México"
                  placeholderTextColor={Colors.silverDark}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              <GoldButton
                title="Crear mi restaurante"
                onPress={handleRegister}
                loading={registerLoading}
                disabled={!isValid}
                style={{ marginTop: 8 }}
              />

              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta?{' '}
                  <Text style={styles.linkAccent}>Inicia sesión</Text>
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
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scrollTablet: {
    maxWidth: 460,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 28,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 8,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: Colors.jadeMuted,
    marginVertical: 10,
    opacity: 0.5,
  },
  subtitle: {
    color: Colors.silverMuted,
    fontSize: 12,
    letterSpacing: 2,
  },
  form: {
    gap: 14,
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
