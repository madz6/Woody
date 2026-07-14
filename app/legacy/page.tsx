import { notFound } from 'next/navigation'
import { HomeScreen } from '@/components/screens/HomeScreen'

export default function LegacyPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <HomeScreen />
}
