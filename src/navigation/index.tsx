import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { screens } from '../screens';
import useLanguageStore from '../store/language';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from '../localization/i18next';

const Stack = createNativeStackNavigator();
const Tab = createMaterialBottomTabNavigator();

const TabIcon = ({ source, color }) => {
  return (
    <Image
      source={source}
      style={{
        tintColor: color,
        width: hp(3),
        height: hp(3),
        resizeMode: 'contain',
      }}
    />
  );
};

const Navigation = () => {
  const { setLanguage } = useLanguageStore();
  const { t } = useTranslation();

    useEffect(() => {
        try {
            AsyncStorage.getItem('language')
                .then(language => {
                    if (language) {
                        i18next.changeLanguage(language);
                        setLanguage(language);
                    } else {
                        setLanguage('en');
                    }
                })
                .catch(() => {
                    setLanguage('en');
                });
        }
        catch (error) {

            console.log(error);
        }
    });
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" component={screens.Login} />
        <Stack.Screen name="signUp" component={screens.SignUp} />
        <Stack.Screen name="forgotPassword" component={screens.ForgotPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
