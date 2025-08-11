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
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" component={screens.Login} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
