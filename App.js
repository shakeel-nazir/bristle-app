import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import BookingScreen from './src/screens/BookingScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import { BookingProvider } from './src/context/BookingContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <BookingProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Booking" component={BookingScreen} />
          <Stack.Screen name="Confirm" component={ConfirmScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </BookingProvider>
  );
}
