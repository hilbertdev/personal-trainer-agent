import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

import { listOrganizations } from '@/src/api/auth';

export default function HomeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: listOrganizations,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your workspaces</Text>
      {isLoading && <Text style={styles.muted}>Loading…</Text>}
      {error && <Text style={styles.error}>Could not load organizations.</Text>}
      {data?.map((org) => (
        <View key={org.id} style={styles.card}>
          <Text style={styles.cardTitle}>{org.name}</Text>
          <Text style={styles.muted}>{org.slug}</Text>
        </View>
      ))}
      {!isLoading && !error && data?.length === 0 && (
        <Text style={styles.muted}>No organizations yet.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  muted: { color: '#6b7280' },
  error: { color: '#b91c1c' },
});
