import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function VariantSelector({
  colors = [],
  sizes = [],
  selectedColor,
  selectedSize,
  onSelectColor,
  onSelectSize,
  isColorAvailable = () => true,
  isSizeAvailable = () => true,
  activeVariant,
}) {
  const hasColors = Array.isArray(colors) && colors.length > 0;
  const hasSizes = Array.isArray(sizes) && sizes.length > 0;

  if (!hasColors && !hasSizes) return null;

  const selectedColorObj = hasColors ? colors.find((c) => c.id === selectedColor) : null;
  const selectedColorText = selectedColorObj ? (selectedColorObj.value || selectedColorObj.name || '') : '';

  const selectedSizeObj = hasSizes ? sizes.find((s) => s.id === selectedSize) : null;
  const selectedSizeText = selectedSizeObj ? (selectedSizeObj.value || selectedSizeObj.name || '') : '';

  const hasAnySelection = Boolean(selectedColor || selectedSize);

  return (
    <View style={styles.container}>
      {/* Header bar with Reset All if any variant is selected */}
      {hasAnySelection && (
        <View style={styles.resetBar}>
          <Text style={styles.resetBarTitle}>Select Variant</Text>
          <TouchableOpacity
            style={styles.resetAllBtn}
            activeOpacity={0.7}
            onPress={() => {
              if (onSelectColor) onSelectColor(null);
              if (onSelectSize) onSelectSize(null);
            }}
          >
            <Ionicons name="refresh-outline" size={13} color="#e11d48" />
            <Text style={styles.resetAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Color Selection */}
      {hasColors ? (
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <View style={styles.labelGroup}>
              <Text style={styles.label}>Color</Text>
              {Boolean(selectedColorText) && (
                <Text style={styles.selectedName}>{selectedColorText}</Text>
              )}
            </View>
            {Boolean(selectedColor) && (
              <TouchableOpacity
                style={styles.clearBtn}
                activeOpacity={0.7}
                onPress={() => onSelectColor && onSelectColor(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color="#e11d48" />
                <Text style={styles.clearBtnText}>Clear Color</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chipRow}>
            {colors.map((color) => {
              const isSelected = selectedColor === color.id;
              const isAvailable = isColorAvailable(color.id);
              const hex = color.hex;
              const displayText = color.value || color.name || 'Color';

              return (
                <TouchableOpacity
                  key={color.id}
                  activeOpacity={0.7}
                  style={[
                    styles.colorChip,
                    isSelected && styles.colorChipSelected,
                    !isAvailable && styles.chipDisabled,
                  ]}
                  onPress={() => onSelectColor && onSelectColor(isSelected ? null : color.id)}
                >
                  {hex ? (
                    <View
                      style={[
                        styles.colorCircle,
                        { backgroundColor: hex },
                        isSelected && styles.colorCircleSelected,
                      ]}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                      !isAvailable && styles.chipTextDisabled,
                    ]}
                  >
                    {displayText}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={13} color={theme.colors.white} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Size Selection */}
      {hasSizes ? (
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <View style={styles.labelGroup}>
              <Text style={styles.label}>Size</Text>
              {Boolean(selectedSizeText) && (
                <Text style={styles.selectedName}>{selectedSizeText}</Text>
              )}
            </View>
            {Boolean(selectedSize) && (
              <TouchableOpacity
                style={styles.clearBtn}
                activeOpacity={0.7}
                onPress={() => onSelectSize && onSelectSize(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={14} color="#e11d48" />
                <Text style={styles.clearBtnText}>Clear Size</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.chipRow}>
            {sizes.map((size) => {
              const isSelected = selectedSize === size.id;
              const isAvailable = isSizeAvailable(size.id);
              const displayText = size.value || size.name || 'Size';

              return (
                <TouchableOpacity
                  key={size.id}
                  activeOpacity={0.7}
                  style={[
                    styles.sizeChip,
                    isSelected && styles.sizeChipSelected,
                    !isAvailable && styles.chipDisabled,
                  ]}
                  onPress={() => onSelectSize && onSelectSize(isSelected ? null : size.id)}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      isSelected && styles.sizeTextSelected,
                      !isAvailable && styles.chipTextDisabled,
                    ]}
                  >
                    {displayText}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={13} color={theme.colors.white} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Variant Stock Feedback */}
      {activeVariant ? (
        <View style={styles.stockInfo}>
          {activeVariant.stock > 0 ? (
            <View style={styles.inStockBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.inStockText}>
                In Stock {activeVariant.stock <= 5 ? `(Only ${activeVariant.stock} left!)` : `(${activeVariant.stock} available)`}
              </Text>
            </View>
          ) : (
            <View style={styles.outOfStockBadge}>
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={styles.outOfStockText}>Currently Out of Stock</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.stockInfo}>
          <Text style={styles.selectHintText}>Please select a size or color to check stock</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  resetBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  resetBarTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  resetAllText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#e11d48',
  },
  section: {
    gap: theme.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  selectedName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fff1f2',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: theme.radius.full,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#e11d48',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: 4,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 6,
  },
  colorChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.38,
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  colorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  colorCircleSelected: {
    borderColor: theme.colors.white,
  },
  chipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  chipTextDisabled: {
    color: theme.colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  sizeChip: {
    minWidth: 46,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sizeChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  sizeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  sizeTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.extrabold,
  },
  stockInfo: {
    marginTop: 4,
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  inStockText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#059669',
  },
  outOfStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef2f2',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  outOfStockText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#dc2626',
  },
  selectHintText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
