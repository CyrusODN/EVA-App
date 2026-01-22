import * as React from 'react';
import { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import { View, Text } from 'react-native';
import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
  configureFonts,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { fontConfig } from './src/constants/fonts';
import Navigation from './src/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors } from './src/constants/colors';
import { toastConfig } from './src/utils/toastMessage';

const queryClient = new QueryClient();

const theme = {
  ...DefaultTheme,
  colors: colors,
  fonts: configureFonts({ config: fontConfig as any }),
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <Navigation />
        <Toast config={toastConfig} />
      </PaperProvider>
    </QueryClientProvider>
  );
};

export default App;
