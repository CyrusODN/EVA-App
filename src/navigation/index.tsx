/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { Image, View, Text, Animated, Platform, Pressable } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { screens } from '../screens';
import useLanguageStore from '../store/language';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from '../localization/i18next';
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradientColors } from '../constants/linearGradientColors';
import { CommonActions } from '@react-navigation/native';
import { images } from '../constants/images';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ source, color, focused, size = hp(3) }) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.1 : 1)).current;

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.1 : 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [focused]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={source}
        style={{
          tintColor: color,
          width: size,
          height: size,
          resizeMode: 'contain',
        }}
      />
    </Animated.View>
  );
};

const CustomTabBar = ({ state, descriptors, navigation, insets }) => {
  const { t } = useTranslation();
  const tabBarHeight = hp(8.5);

  const tabLabels = {
    Home: t('navigation.tabs.home') || 'Home',
    AITools: t('navigation.tabs.aiTools') || 'AI Tools',
    Profile: t('navigation.tabs.profile') || 'Profile',
  };

  const handleTabPress = (
    route: { key: any; name: string; params: object | undefined },
    isFocused: boolean,
  ) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.dispatch({
        ...CommonActions.navigate(route.name, route.params),
        target: state.key,
      });
    }
  };

  return (
    <LinearGradient
      colors={LinearGradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
        overflow: 'hidden',
        height: hp(12),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          height: tabBarHeight,
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: wp(4),
          backgroundColor: 'transparent',
          paddingTop: hp(2),
        }}
      >
        {state.routes.map(
          (
            route: { key: React.Key | null | undefined; name: string | number },
            index: any,
          ) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;
            const icon = options.tabBarIcon;

            return (
              <Pressable
                key={route.key}
                onPress={() => handleTabPress(route, isFocused)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: hp(1),
                  position: 'relative',
                }}
                android_ripple={{
                  color: 'rgba(255, 255, 255, 0.2)',
                  borderless: true,
                  radius: wp(15),
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      marginBottom: hp(0.3),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {icon &&
                      icon({
                        focused: isFocused,
                        color: isFocused
                          ? '#ffffff'
                          : 'rgba(255, 255, 255, 0.65)',
                        size: isFocused ? hp(3.2) : hp(2.8),
                      })}
                  </View>

                  {/* Label */}
                  <Text
                    style={{
                      fontSize: hp(1.2),
                      fontWeight: isFocused ? '600' : '400',
                      color: isFocused
                        ? '#ffffff'
                        : 'rgba(255, 255, 255, 0.65)',
                      marginTop: hp(0.2),
                      letterSpacing: 0.2,
                    }}
                    numberOfLines={1}
                  >
                    {tabLabels[route.name] || route.name}
                  </Text>

                  {/* Active background highlight */}
                  {isFocused && (
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: -hp(1.5),
                        left: -wp(8),
                        right: -wp(8),
                        bottom: -hp(1),
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: 200,
                        zIndex: -1,
                      }}
                    />
                  )}
                </View>
              </Pressable>
            );
          },
        )}
      </View>
    </LinearGradient>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: 'none',
        },
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Home"
        component={screens.Home}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={images.homeIcon} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="AITools"
        component={screens.AITools}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={images.aiIcon} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={screens.Profile}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              source={images.profileIcon}
              color={color}
              focused={focused}
            />
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
        <Stack.Screen name="transactions" component={screens.Transactions} />
        <Stack.Screen
          name="transcriptionCompleted"
          component={screens.TranscriptionComplete}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
