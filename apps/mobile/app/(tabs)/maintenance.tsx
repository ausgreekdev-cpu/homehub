import { View, Text, StyleSheet } from 'react-native'

export default function Maintenance() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maintenance</Text>
      <Text>No open requests</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
})
