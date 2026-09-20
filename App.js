import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

import HomeScreen from './src/screens/HomeScreen';
import DurationScreen from './src/screens/DurationScreen';
import TaskBuilderScreen from './src/screens/TaskBuilderScreen';
import BookingScreen from './src/screens/BookingScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import LegalScreen from './src/screens/LegalScreen';
import BecomeCleanerScreen from './src/screens/BecomeCleanerScreen';
import CleanerApplicationSuccessScreen from './src/screens/CleanerApplicationSuccessScreen';
import ReferScreen from './src/screens/ReferScreen';
import RedeemCodeScreen from './src/screens/RedeemCodeScreen';
import AdminScreen from './src/screens/AdminScreen';
import AccountScreen from './src/screens/AccountScreen';
import LoginScreen from './src/screens/LoginScreen';
import { BookingProvider } from './src/context/BookingContext';
import { ApplicationProvider } from './src/context/ApplicationContext';
import { AuthProvider, authRequired, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();

function Root() {
  const { user, loading } = useAuth();

  if (authRequired && loading) return null;
  if (authRequired && !user) return <LoginScreen />;

  // Keyed by user so one person's bookings never show up for the next person on the device.
  return (
    <BookingProvider key={user?.uid || 'local'}>
        <ApplicationProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                ...TransitionPresets.SlideFromRightIOS,
                transitionSpec: {
                  open: { animation: 'timing', config: { duration: 380 } },
                  close: { animation: 'timing', config: { duration: 320 } },
                },
                cardStyle: { flex: 1 },
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="Duration"
                component={DurationScreen}
                options={{ cardStyleInterpolator: CardStyleInterpolators.forFade }}
              />
              <Stack.Screen name="TaskBuilder" component={TaskBuilderScreen} />
              <Stack.Screen name="Booking" component={BookingScreen} />
              <Stack.Screen name="Confirm" component={ConfirmScreen} />
              <Stack.Screen name="Success" component={SuccessScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
              <Stack.Screen name="BecomeCleaner" component={BecomeCleanerScreen} />
              <Stack.Screen name="CleanerApplicationSuccess" component={CleanerApplicationSuccessScreen} />
              <Stack.Screen name="Refer" component={ReferScreen} />
              <Stack.Screen name="RedeemCode" component={RedeemCodeScreen} />
              <Stack.Screen name="Admin" component={AdminScreen} />
              <Stack.Screen name="Account" component={AccountScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </ApplicationProvider>
    </BookingProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
