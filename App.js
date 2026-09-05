import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts, Fredoka_700Bold } from '@expo-google-fonts/fredoka';

import HomeScreen from './src/screens/HomeScreen';
import TaskBuilderScreen from './src/screens/TaskBuilderScreen';
import BookingScreen from './src/screens/BookingScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import { BookingProvider } from './src/context/BookingContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_700Bold });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <BookingProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="TaskBuilder" component={TaskBuilderScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Confirm" component={ConfirmScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </BookingProvider>
  );
}
