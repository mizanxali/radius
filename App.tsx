import { useEffect } from 'react';
import { StatusBar, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  createNavigationContainerRef,
  DarkTheme,
  NavigationContainer,
  type NavigatorScreenParams,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import { AppKit, AppKitProvider } from '@reown/appkit-react-native';
import { bootMesh } from './src/peers';
import { appKit, refreshNetWorth } from './src/wallet';
import { useMyProfile } from './src/peers';
import ProfileEditor from './src/screens/ProfileEditor';
import Radar from './src/screens/Radar';
import Person from './src/screens/Person';
import Me from './src/screens/Me';
import Matches from './src/screens/Matches';
import Room from './src/screens/Room';
import Finder from './src/screens/Finder';
import { WaveBanner } from './src/wave';
import { MeetPrompt, retryPendingMints } from './src/meet';
import { C } from './src/theme';

type Tabs = {
  Radar: undefined;
  Matches: undefined;
  Room: undefined;
  Me: undefined;
};
type Root = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<Tabs>;
  Person: { id: string };
  Finder: { id: string };
  EditProfile: undefined;
};

const nav = createNavigationContainerRef<Root>();

const Stack = createNativeStackNavigator<Root>();
const Tab = createBottomTabNavigator<Tabs>();

const icon =
  (emoji: string) =>
  ({ focused }: { focused: boolean }) =>
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.text,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.line },
        tabBarLabelStyle: { fontWeight: '800' },
      }}
    >
      <Tab.Screen name="Radar" options={{ tabBarIcon: icon('📡') }}>
        {({ navigation }: BottomTabScreenProps<Tabs, 'Radar'>) => (
          <Radar
            onOpen={id => navigation.getParent()?.navigate('Person', { id })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Matches" options={{ tabBarIcon: icon('✨') }}>
        {({ navigation }: BottomTabScreenProps<Tabs, 'Matches'>) => (
          <Matches
            onOpen={id => navigation.getParent()?.navigate('Person', { id })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Room"
        component={Room}
        options={{ tabBarIcon: icon('🏆') }}
      />
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
    bootMesh()
      .then(() => {
        retryPendingMints();
        // Prices move; re-price my wallets at most hourly.
        const at = profile?.netWorthAt ?? 0;
        if (profile?.wallets.length && Date.now() - at > 3_600_000)
          return refreshNetWorth();
      })
      .catch(err => console.warn('boot failed', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaProvider>
      <AppKitProvider instance={appKit}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer
          ref={nav}
          theme={{
            ...DarkTheme,
            colors: { ...DarkTheme.colors, background: C.bg },
          }}
        >
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!profile ? (
              <Stack.Screen name="Onboarding">
                {() => <ProfileEditor onDone={() => {}} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="Main" component={MainTabs} />
                <Stack.Screen name="Person" options={{ presentation: 'modal' }}>
                  {({
                    route,
                    navigation,
                  }: NativeStackScreenProps<Root, 'Person'>) => (
                    <Person
                      id={route.params.id}
                      onClose={navigation.goBack}
                      onFind={() =>
                        navigation.navigate('Finder', { id: route.params.id })
                      }
                    />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="Finder"
                  options={{ presentation: 'fullScreenModal' }}
                >
                  {({
                    route,
                    navigation,
                  }: NativeStackScreenProps<Root, 'Finder'>) => (
                    <Finder id={route.params.id} onClose={navigation.goBack} />
                  )}
                </Stack.Screen>
                <Stack.Screen
                  name="EditProfile"
                  options={{ presentation: 'modal' }}
                >
                  {({
                    navigation,
                  }: NativeStackScreenProps<Root, 'EditProfile'>) => (
                    <ProfileEditor onDone={navigation.goBack} />
                  )}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <WaveBanner
          onOpen={id => nav.isReady() && nav.navigate('Person', { id })}
        />
        <MeetPrompt />
        <AppKit />
      </AppKitProvider>
    </SafeAreaProvider>
  );
}
