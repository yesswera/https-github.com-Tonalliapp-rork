import React, { useRef, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface GoldButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'outline' | 'jade';
  icon?: React.ReactNode;
}

export default function GoldButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
  icon,
}: GoldButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  }, [disabled, loading, onPress]);

  if (variant === 'outline') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <TouchableOpacity
          style={[styles.outlineButton, disabled && styles.disabled]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          disabled={disabled || loading}
        >
          {icon}
          <Text style={styles.outlineText}>{title}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'jade') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <TouchableOpacity
          style={[styles.jadeButton, disabled && styles.disabled]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.black} size="small" />
          ) : (
            <>
              {icon}
              <Text style={styles.jadeText}>{title}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled || loading}
        style={disabled ? styles.disabled : undefined}
      >
        <LinearGradient
          colors={[Colors.gold, Colors.goldDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={Colors.black} size="small" />
          ) : (
            <>
              {icon}
              <Text style={styles.primaryText}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  primaryText: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gold,
    gap: 8,
  },
  outlineText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  jadeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.jade,
    gap: 8,
  },
  jadeText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
