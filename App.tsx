import { useEffect } from 'react';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { bootMesh } from './src/peers';
import { useMyProfile } from './src/profile';
import ProfileEditor from './src/screens/ProfileEditor';
import Radar from './src/screens/Radar';
import Person from './src/screens/Person';
import Me from './src/screens/Me';
import { C } from './src/theme';

type Tabs = { Radar: undefined; Me: undefined };
type Root = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<Tabs>;
  Person: { id: string };
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<Root>();
const Tab = createBottomTabNavigator<Tabs>();

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.line },
        tabBarLabelStyle: { fontWeight: '800' },
      }}>
      <Tab.Screen name="Radar" options={{ tabBarIcon: icon('📡') }}>
        {({ navigation }: BottomTabScreenProps<Tabs, 'Radar'>) => (
          <Radar onOpen={id => navigation.getParent()?.navigate('Person', { id })} />
        )}
      </Tab.Screen>
      <Tab.Screen name="Me" options={{ tabBarIcon: icon('😎') }}>
        {({ navigation }: BottomTabScreenProps<Tabs, 'Me'>) => (
          <Me onEdit={() => navigation.getParent()?.navigate('EditProfile')} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [profile] = useMyProfile();
  useEffect(() => {
    bootMesh().catch(err => console.warn('mesh boot failed', err));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: C.bg } }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!profile ? (
            <Stack.Screen name="Onboarding">{() => <ProfileEditor onDone={() => {}} />}</Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Person" options={{ presentation: 'modal' }}>
                {({ route, navigation }: NativeStackScreenProps<Root, 'Person'>) => (
                  <Person id={route.params.id} onClose={navigation.goBack} />
                )}
              </Stack.Screen>
              <Stack.Screen name="EditProfile" options={{ presentation: 'modal' }}>
                {({ navigation }: NativeStackScreenProps<Root, 'EditProfile'>) => (
                  <ProfileEditor onDone={navigation.goBack} />
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
