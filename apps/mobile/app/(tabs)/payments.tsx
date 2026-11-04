import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function Payments() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payments</Text>
      <View style={styles.card}>
        <Text style={styles.amount}>$1,250.00</Text>
        <Text style={styles.due}>Due on 1st of month</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Pay Rent</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 20 },
  amount: { fontSize: 32, fontWeight: 'bold' },
  due: { color: '#666', marginTop: 5 },
  button: { backgroundColor: '#000', padding: 15, borderRadius: 8, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
})
