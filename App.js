import './src/config/polyfill';
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { HRMSProvider } from './src/context/HRMSContext';
import { PayrollProvider } from './src/context/PayrollContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HRMSProvider>
          <PayrollProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </PayrollProvider>
        </HRMSProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
