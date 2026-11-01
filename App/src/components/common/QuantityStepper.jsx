// Quantity Increment / Decrement Stepper
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';

export default function QuantityStepper({
  quantity = 1,
  min = 1,
  max = 99,
  maxQuantity,
  onIncrease,
  onDecrease,
  onChange,
  disabled = false,
  size = 'md', // 'sm' | 'md'
}) {
  const isSm = size === 'sm';
  const effectiveMax = maxQuantity !== undefined ? maxQuantity : max;

  const handleDecrease = () => {
    if (disabled || quantity <= min) return;
    if (onDecrease) onDecrease();
    if (onChange) onChange(quantity - 1);
  };

  const handleIncrease = () => {
    if (disabled || quantity >= effectiveMax) return;
    if (onIncrease) onIncrease();
    if (onChange) onChange(quantity + 1);
  };

  return (
    <View style={[styles.container, isSm && styles.smContainer]}>
      <TouchableOpacity
        style={[styles.btn, isSm && styles.smBtn]}
        onPress={handleDecrease}
        disabled={disabled || quantity <= min}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="remove"
          size={isSm ? 14 : 18}
          color={quantity <= min ? Colors.textLight : Colors.primary}
        />
      </TouchableOpacity>

      <Text style={[styles.quantityText, isSm && styles.smText]}>
        {quantity}
      </Text>

      <TouchableOpacity
        style={[styles.btn, isSm && styles.smBtn]}
        onPress={handleIncrease}
        disabled={disabled || quantity >= effectiveMax}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="add"
          size={isSm ? 14 : 18}
          color={quantity >= effectiveMax ? Colors.textLight : Colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  smContainer: {
    borderRadius: Radius.sm,
  },
  btn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 26,
    textAlign: 'center',
  },
  smText: {
    fontSize: 12,
    minWidth: 20,
  },
});
