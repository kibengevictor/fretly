import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? '/(tabs)/lessons' : '/auth'} />;
}
