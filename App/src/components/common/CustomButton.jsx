// Reusable Styled Button Component
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  icon = null,
  style = null,
  textStyle = null,
}) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'primary':
      default:
        return styles.primaryBtn;
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'outline':
        return Colors.primary;
      case 'secondary':
        return Colors.primaryDark;
      case 'danger':
      case 'primary':
      default:
        return Colors.white;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 18;
      return <Ionicons name={icon} size={iconSize} color={getIconColor()} />;
    }
    return icon;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        getButtonStyles(),
        getSizeStyles(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? Colors.primary : Colors.white}
        />
      ) : (
        <>
          {renderIcon()}
          <Text style={[styles.baseText, getTextStyles(), textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  sizeLg: {
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  secondaryBtn: {
    backgroundColor: Colors.accent,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dangerBtn: {
    backgroundColor: Colors.sale,
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontWeight: '800',
    fontSize: 14,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.primaryDark,
  },
  outlineText: {
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.white,
  },
});
