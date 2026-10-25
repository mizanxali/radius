import { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import {
  CircleUserRound,
  Radar as RadarIcon,
  Sparkles,
  Trophy,
} from 'lucide-react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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
import { isDemo, setDemo } from './src/demo';
import { appKit, refreshNetWorth } from './src/wallet';
import { summarizeMyWebsite } from './src/ai';
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
import type { Icon } from './src/ui';

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

// Each tab lights up in its own accent, with a dot underneath.
const icon =
  (I: Icon, accent: string) =>
  ({ focused }: { focused: boolean }) =>
    (
      <View style={{ alignItems: 'center', gap: 6 }}>
        <I size={22} color={focused ? accent : C.faint} strokeWidth={1.9} />
        <View
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: focused ? accent : 'transparent',
          }}
        />
      </View>
    );

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopWidth: 1,
          borderTopColor: C.line,
          height: 64 + insets.bottom,
          paddingTop: 12,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <Tab.Screen
        name="Radar"
        options={{ tabBarIcon: icon(RadarIcon, C.blue) }}
      >
        {({ navigation }: BottomTabScreenProps<Tabs, 'Radar'>) => (
          <Radar
            onOpen={id => navigation.getParent()?.navigate('Person', { id })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Matches"
        options={{ tabBarIcon: icon(Sparkles, C.purple) }}
      >
        {({ navigation }: BottomTabScreenProps<Tabs, 'Matches'>) => (
          <Matches
            onOpen={id => navigation.getParent()?.navigate('Person', { id })}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Room"
        component={Room}
        options={{ tabBarIcon: icon(Trophy, C.amber) }}
      />
      <Tab.Screen
        name="Me"
        options={{ tabBarIcon: icon(CircleUserRound, C.green) }}
      >
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
        if (isDemo()) setDemo(true);
        retryPendingMints();
        summarizeMyWebsite(); // no-op unless a website is still unread
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
