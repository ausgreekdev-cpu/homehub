export function parseRRule(rule: string): { freq: string; interval: number } {
  const parts = rule.split(';')
  const freq = parts.find(p => p.startsWith('FREQ='))?.split('=')[1] || 'WEEKLY'
  const interval = parseInt(parts.find(p => p.startsWith('INTERVAL='))?.split('=')[1] || '1')
  return { freq, interval }
}

export function getNextOccurrence(lastDate: string, rule: string): string {
  const { freq, interval } = parseRRule(rule)
  const date = new Date(lastDate)
  
  if (freq === 'DAILY') {
    date.setDate(date.getDate() + interval)
  } else if (freq === 'WEEKLY') {
    date.setDate(date.getDate() + 7 * interval)
  } else if (freq === 'MONTHLY') {
    date.setMonth(date.getMonth() + interval)
  } else if (freq === 'YEARLY') {
    date.setFullYear(date.getFullYear() + interval)
  }
  
  return date.toISOString().split('T')[0] || date.toISOString().substring(0, 10)
}
