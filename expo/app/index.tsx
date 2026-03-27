import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScanLine, Store } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  const glowPulse = useRef(new Animated.Value(0.3)).current;
  const sunScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sunScale, { toValue: 1, useNativeDriver: true, speed: 3, bounciness: 8 }),
      Animated.timing(fadeIn, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, useNativeDriver: true, delay: 400 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, isTablet && styles.contentTablet]}>
          <Animated.View style={[styles.heroSection, { opacity: fadeIn }]}>
            <Animated.View style={[styles.sunContainer, { transform: [{ scale: sunScale }] }]}>
              <Animated.View style={[styles.sunGlow, { opacity: glowPulse }]} />
              <View style={styles.sunCore} />
              <View style={styles.sunRing} />
              <View style={styles.sunRingOuter} />
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                <View
                  key={angle}
                  style={[
                    styles.ray,
                    { transform: [{ rotate: `${angle}deg` }, { translateY: -42 }] },
                  ]}
                />
              ))}
              {[45, 135, 225, 315].map((angle) => (
                <View
                  key={`jade-${angle}`}
                  style={[
                    styles.jadeAccent,
                    { transform: [{ rotate: `${angle}deg` }, { translateY: -34 }] },
                  ]}
                />
              ))}
            </Animated.View>

            <Text style={styles.logo}>TONALLI</Text>
            <View style={styles.dividerContainer}>
              <LinearGradient
                colors={['transparent', Colors.gold, Colors.jadeMuted, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.dividerGradient}
              />
            </View>
            <Text style={styles.tagline}>
              ENERGÍA <Text style={styles.taglineVital}>VITAL</Text> EN CADA MESA
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.actionsSection,
              { opacity: fadeIn, transform: [{ translateY: slideUp }] },
            ]}
          >
            <TouchableOpacity
              style={styles.clientCard}
              onPress={() => router.push('/client')}
              activeOpacity={0.8}
              testID="landing-client"
            >
              <LinearGradient
                colors={[Colors.gold, Colors.goldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.clientCardGradient}
              >
                <ScanLine size={28} color={Colors.black} />
                <View style={styles.cardTextGroup}>
                  <Text style={styles.clientCardTitle}>Soy Cliente</Text>
                  <Text style={styles.clientCardSubtitle}>
                    Escanea el QR de tu mesa para ver el menú y ordenar
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.8}
              testID="landing-restaurant"
            >
              <Store size={24} color={Colors.jade} />
              <View style={styles.cardTextGroup}>
                <Text style={styles.restaurantCardTitle}>Soy Restaurante</Text>
                <Text style={styles.restaurantCardSubtitle}>
                  Gestiona pedidos, menú, mesas y más
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: fadeIn }]}>
            <Text style={styles.footerDomain}>tonalli.app</Text>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  contentTablet: {
    maxWidth: 500,
    alignSelf: 'center' as const,
    width: '100%' as const,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  sunContainer: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  sunGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.goldGlow,
  },
  sunCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.goldLight,
    shadowColor: Colors.goldLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
  },
  sunRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: Colors.gold,
    opacity: 0.5,
  },
  sunRingOuter: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: Colors.jadeMuted,
    opacity: 0.25,
  },
  ray: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: Colors.gold,
    borderRadius: 1,
    opacity: 0.6,
  },
  jadeAccent: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.jade,
    opacity: 0.7,
  },
  logo: {
    fontSize: 48,
    fontWeight: '300' as const,
    color: Colors.gold,
    letterSpacing: 14,
  },
  dividerContainer: {
    width: 100,
    height: 1,
    marginVertical: 14,
  },
  dividerGradient: {
    flex: 1,
  },
  tagline: {
    fontSize: 10,
    color: Colors.silverMuted,
    letterSpacing: 5,
    textTransform: 'uppercase' as const,
  },
  taglineVital: {
    color: Colors.jadeLight,
    fontWeight: '700' as const,
  },
  actionsSection: {
    gap: 14,
  },
  clientCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  clientCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  cardTextGroup: {
    flex: 1,
  },
  clientCardTitle: {
    color: Colors.black,
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 3,
  },
  clientCardSubtitle: {
    color: 'rgba(10,10,10,0.6)',
    fontSize: 12,
    lineHeight: 16,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    borderRadius: 16,
    backgroundColor: Colors.blackCard,
    borderWidth: 1,
    borderColor: Colors.borderJade,
  },
  restaurantCardTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '500' as const,
    marginBottom: 3,
  },
  restaurantCardSubtitle: {
    color: Colors.silverDark,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 48,
  },
  footerDomain: {
    color: Colors.goldMuted,
    fontSize: 12,
    letterSpacing: 2,
  },
});
