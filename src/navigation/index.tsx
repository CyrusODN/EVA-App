/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { Image, View, Text, Animated, Pressable } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { screens } from '../screens';
import useLanguageStore from '../store/language';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from '../localization/i18next';
import LinearGradient from 'react-native-linear-gradient';
import { LinearGradientColors } from '../constants/linearGradientColors';
import { CommonActions } from '@react-navigation/native';
import { images } from '../constants/images';
import { useTranslation } from 'react-i18next';
import { Mic } from 'lucide-react-native';
import { setAuthToken } from '../services/authService';
import userStore from '../store/user';
import RemedyLogoIcon from '../components/RemedyLogoIcon';
import useOnboardingStore from '../store/onboarding';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

const TabIcon = ({
  source,
  color,
  focused,
  size = hp(3),
}: {
  source: ImageSourcePropType;
  color?: string;
  focused: boolean;
  size?: number;
}) => {
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

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps) => {
  const { t } = useTranslation();

  const tabLabels = {
    Home: t('navigation.tabs.home') || 'Home',
    AITools: t('navigation.tabs.aiTools') || 'AI Tools',
    Profile: t('navigation.tabs.profile') || 'Profile',
  };

  const handleTabPress = (
    route: typeof state.routes[number],
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
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
        paddingBottom: hp(2),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingHorizontal: wp(2),
          paddingTop: hp(1.2),
          backgroundColor: 'transparent',
        }}
      >
        {state.routes.map((route, index) => {
            const { options } = descriptors[route.key as string];
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
                  paddingVertical: hp(0.8),
                }}
                android_ripple={{
                  color: 'rgba(70, 183, 198, 0.1)',
                  borderless: true,
                  radius: wp(12),
                }}
              >
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      marginBottom: hp(0.4),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {icon &&
                      icon({
                        focused: isFocused,
                        color: isFocused ? '#46B7C6' : '#64748B',
                      })}
                  </View>

                  {/* Label */}
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: isFocused ? '600' : '500',
                      color: isFocused ? '#46B7C6' : '#64748B',
                      letterSpacing: -0.1,
                      fontFamily: 'System',
                    }}
                    numberOfLines={1}
                  >
                    {tabLabels[route.name as keyof typeof tabLabels] || route.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
      </View>
    </View>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        lazyPreloadDistance: 1,
        tabBarStyle: {
          display: 'none',
        },
      }}
      tabBar={props => <CustomTabBar {...props} />}
      initialLayout={{ width: wp(100) }}
    >
      <Tab.Screen
        name="Home"
        component={screens.Home}
        options={{
          tabBarIcon: ({ color }) => (
            <Mic size={24} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tab.Screen
        name="AITools"
        component={screens.AITools}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <RemedyLogoIcon size={24} color={color} />
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
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

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

  // Get onboarding status
  const { hasCompletedOnboarding } = useOnboardingStore();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const expStr = await AsyncStorage.getItem('auth_session_expires_at');
        const exp = expStr ? parseInt(expStr, 10) : 0;
        const valid = !!token && exp > Date.now();
        if (valid) {
          setAuthToken(token as string);
          userStore.getState().setToken(token as string);
          // Check if onboarding is completed
          if (isMounted) {
            if (hasCompletedOnboarding) {
              setInitialRoute('HomeTabs');
            } else {
              setInitialRoute('Onboarding');
            }
          }
        } else {
          userStore.getState().purgeAuth();
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          await AsyncStorage.removeItem('auth_session_expires_at');
          if (isMounted) setInitialRoute('login');
        }
      } catch {
        if (isMounted) setInitialRoute('login');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [hasCompletedOnboarding]);

  return (
    <NavigationContainer>
      {initialRoute && (
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRoute}
        >
        <Stack.Screen name="login" component={screens.Login} />
        <Stack.Screen name="signUp" component={screens.SignUp} />
        <Stack.Screen
          name="forgotPassword"
          component={screens.ForgotPassword}
        />
        <Stack.Screen
          name="otpVerification"
          component={screens.OtpVerification}
        />
        <Stack.Screen name="Onboarding" component={screens.Onboarding} />
        <Stack.Screen name="HomeTabs" component={BottomTabNavigator} />
        {/* Legacy route name for backwards compatibility */}
        <Stack.Screen name="tabs" component={BottomTabNavigator} />
        <Stack.Screen name="session" component={screens.Session} />
        <Stack.Screen name="discharge" component={screens.Discharge} />
        <Stack.Screen name="consult" component={screens.ClinicalWorkspace} />
        <Stack.Screen name="consultChat" component={screens.ConsultChat} />
        <Stack.Screen name="pharmacopediaChat" component={screens.PharmacopediaChat} />
        <Stack.Screen name="pathFinder" component={screens.Pathfinder} />
        <Stack.Screen name="prescreening" component={screens.Prescreening} />
        <Stack.Screen name="report" component={screens.Report} />
        <Stack.Screen name="research" component={screens.Research} />
        <Stack.Screen name="researchChat" component={screens.ResearchChat} />
        <Stack.Screen name="settings" component={screens.Settings} />
        <Stack.Screen name="subscription" component={screens.Subscription} />
        <Stack.Screen name="transactions" component={screens.Transactions} />
        <Stack.Screen
          name="transcriptionCompleted"
          component={screens.TranscriptionComplete}
        />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default Navigation;
