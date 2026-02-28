import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado', headerStyle: { backgroundColor: Colors.black }, headerTintColor: Colors.silver }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🌑</Text>
        <Text style={styles.title}>Página no encontrada</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.black,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '400' as const,
    color: Colors.silver,
  },
  link: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  linkText: {
    fontSize: 14,
    color: Colors.gold,
    fontWeight: '500' as const,
  },
});
