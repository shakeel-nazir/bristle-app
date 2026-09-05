import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets, CardStyleInterpolators } from '@react-navigation/stack';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

import HomeScreen from './src/screens/HomeScreen';
import TaskBuilderScreen from './src/screens/TaskBuilderScreen';
import BookingScreen from './src/screens/BookingScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import LegalScreen from './src/screens/LegalScreen';
import { BookingProvider } from './src/context/BookingContext';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BookingProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              ...TransitionPresets.SlideFromRightIOS,
              transitionSpec: {
                open: { animation: 'timing', config: { duration: 380 } },
                close: { animation: 'timing', config: { duration: 320 } },
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="TaskBuilder"
              component={TaskBuilderScreen}
              options={{ cardStyleInterpolator: CardStyleInterpolators.forFade }}
            />
            <Stack.Screen name="Booking" component={BookingScreen} />
            <Stack.Screen name="Confirm" component={ConfirmScreen} />
            <Stack.Screen name="Success" component={SuccessScreen} />
            <Stack.Screen name="Legal" component={LegalScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </BookingProvider>
    </GestureHandlerRootView>
  );
}
