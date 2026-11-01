import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const STEPS = [
  { key: 'pending', label: 'Pending', icon: 'time-outline' },
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' },
  { key: 'processing', label: 'Processing', icon: 'cube-outline' },
  { key: 'shipped', label: 'Shipped', icon: 'airplane-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'gift-outline' },
];

export const getStatusIndex = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
};

export default function OrderStatusStepper({ status = 'pending' }) {
  const currentIndex = getStatusIndex(status);
  const isCancelled = status?.toLowerCase() === 'cancelled';

  if (isCancelled) {
    return (
      <View style={styles.cancelledCard}>
        <Ionicons name="close-circle" size={28} color={theme.colors.error} />
        <View style={styles.cancelledInfo}>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>
          <Text style={styles.cancelledSub}>This order has been cancelled.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Connector line between steps */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connector,
                    idx <= currentIndex ? styles.connectorDone : styles.connectorPending,
                  ]}
                />
              )}

              {/* Step Node */}
              <View style={styles.stepNode}>
                <View
                  style={[
                    styles.circle,
                    isDone ? styles.circleDone : styles.circlePending,
                    isCurrent && styles.circleCurrent,
                  ]}
                >
                  <Ionicons
                    name={isDone ? 'checkmark' : step.icon}
                    size={14}
                    color={isDone ? theme.colors.white : theme.colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isDone && styles.stepLabelDone,
                    isCurrent && styles.stepLabelCurrent,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connector: {
    flex: 1,
    height: 3,
    marginBottom: 20,
  },
  connectorDone: {
    backgroundColor: theme.colors.primary,
  },
  connectorPending: {
    backgroundColor: theme.colors.border,
  },
  stepNode: {
    alignItems: 'center',
    width: 60,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleDone: {
    backgroundColor: theme.colors.primary,
  },
  circlePending: {
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  circleCurrent: {
    borderWidth: 2.5,
    borderColor: theme.colors.accent,
  },
  stepLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  stepLabelCurrent: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff1f2',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginVertical: theme.spacing.sm,
  },
  cancelledInfo: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,
  },
  cancelledSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
