import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SettingsProvider } from '../../src/contexts/SettingsContext';
import { ProgressProvider } from '../../src/contexts/ProgressContext';
import { Redirect } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  if (!user) return <Redirect href="/auth" />;

  return (
    <SettingsProvider>
      <ProgressProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1ed19a',
            tabBarStyle: { backgroundColor: '#171b20', borderTopColor: '#252a31' },
            tabBarInactiveTintColor: '#77818d',
          }}
        >
          <Tabs.Screen
            name="lessons"
            options={{
              title: 'Lessons',
              tabBarIcon: ({ color, size }) => <Ionicons name="school" size={size} color={color as any} />,
            }}
          />
          <Tabs.Screen
            name="tuner"
            options={{
              title: 'Tuner',
              tabBarIcon: ({ color, size }) => <Ionicons name="musical-notes" size={size} color={color as any} />,
            }}
          />
          <Tabs.Screen
            name="songs"
            options={{
              title: 'Songs',
              tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color as any} />,
            }}
          />
          <Tabs.Screen
            name="practice"
            options={{
              title: 'Practice',
              tabBarIcon: ({ color, size }) => <Ionicons name="timer" size={size} color={color as any} />,
            }}
          />
          <Tabs.Screen
            name="account"
            options={{
              title: 'Account',
              tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color as any} />,
            }}
          />
        </Tabs>
      </ProgressProvider>
    </SettingsProvider>
  );
}
