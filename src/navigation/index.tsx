import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, BottomNavigation } from 'react-native-paper';
import { screens } from '../screens';
import useLanguageStore from '../store/language';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from '../localization/i18next';
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradientColors } from '../constants/linearGradientColors';
import {
  CommonActions,
  createStaticNavigation,
} from '@react-navigation/native';
import { images } from '../constants/images';
import { colors } from '../constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <LinearGradient
          colors={LinearGradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <BottomNavigation.Bar
            navigationState={state}
            safeAreaInsets={insets}
            activeColor="#ffffff"
            inactiveColor={colors.inverseSurface} //'rgba(255, 255, 255, 0.6)'
            style={{ backgroundColor: 'transparent' }}
            theme={{
              colors: {
                onSurface: 'rgba(255, 255, 255, 0.6)', // Inactive color
                primary: '#ffffff', // Active color
              },
            }}
            onTabPress={({ route, preventDefault }) => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (event.defaultPrevented) {
                preventDefault();
              } else {
                navigation.dispatch({
                  ...CommonActions.navigate(route.name, route.params),
                  target: state.key,
                });
              }
            }}
            renderIcon={({ route, focused, color }) =>
              descriptors[route.key].options.tabBarIcon?.({
                focused,
                color,
                size: 24,
              }) || null
            }
            getLabelText={({ route }) => {
              const { options } = descriptors[route.key];
              const label =
                typeof options.tabBarLabel === 'string'
                  ? options.tabBarLabel
                  : typeof options.title === 'string'
                  ? options.title
                  : route.name;

              return label;
            }}
          />
          //
        </LinearGradient>
      )}
    >
      <Tab.Screen
        name="Home"
        component={screens.Home}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon source={images.homeIcon} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AITools"
        component={screens.AITools}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon source={images.aiIcon} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={screens.Profile}
        options={{
          tabBarIcon: ({ color }) => (
            <TabIcon source={images.profileIcon} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { setLanguage } = useLanguageStore();

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem('language');
        const target = stored || 'en';

        if (i18next.language !== target) {
          await i18next.changeLanguage(target);
        }

        if (isMounted) {
          setLanguage(target);
        }
      } catch {
        if (isMounted) {
          setLanguage('en');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" component={screens.Login} />
        <Stack.Screen name="signUp" component={screens.SignUp} />
        <Stack.Screen
          name="forgotPassword"
          component={screens.ForgotPassword}
        />
        <Stack.Screen name="tabs" component={BottomTabNavigator} />
        <Stack.Screen name="session" component={screens.Session} />
        <Stack.Screen name="discharge" component={screens.Discharge} />
        <Stack.Screen name="consult" component={screens.Consult} />
        <Stack.Screen name="pathFinder" component={screens.Pathfinder} />
        <Stack.Screen name="pharmcoedia" component={screens.Pharmcoedia} />
        <Stack.Screen name="prescreening" component={screens.Prescreening} />
        <Stack.Screen name="report" component={screens.Report} />
        <Stack.Screen name="research" component={screens.Research} />
        <Stack.Screen name="settings" component={screens.Settings} />
        <Stack.Screen name="subscription" component={screens.Subscription} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
