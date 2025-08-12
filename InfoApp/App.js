import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-url-polyfill/auto';

import HomeScreen from './src/screens/HomeScreen';
import NewsScreen from './src/screens/NewsScreen';
import PoliticiansScreen from './src/screens/PoliticiansScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { COLORS } from './src/styles/colors';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color, size }) => {
  let iconName;

  switch (name) {
    case 'Główna':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Newsy':
      iconName = focused ? 'newspaper' : 'newspaper-outline';
      break;
    case 'Politycy':
      iconName = focused ? 'people' : 'people-outline';
      break;
    case 'Profil':
      iconName = focused ? 'person' : 'person-outline';
      break;
    default:
      iconName = 'help-outline';
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={COLORS.primary} />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => (
              <TabIcon
                name={route.name}
                focused={focused}
                color={color}
                size={size}
              />
            ),
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.gray,
            tabBarStyle: {
              backgroundColor: COLORS.white,
              borderTopWidth: 1,
              borderTopColor: COLORS.lightGray,
              paddingTop: 5,
              paddingBottom: 5,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              marginBottom: 2,
            },
            headerStyle: {
              backgroundColor: COLORS.primary,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          })}
        >
          <Tab.Screen
            name="Główna"
            component={HomeScreen}
            options={{
              headerTitle: 'InfoApp',
            }}
          />
          <Tab.Screen
            name="Newsy"
            component={NewsScreen}
            options={{
              headerTitle: 'Najnowsze Newsy',
            }}
          />
          <Tab.Screen
            name="Politycy"
            component={PoliticiansScreen}
            options={{
              headerTitle: 'Politycy',
            }}
          />
          <Tab.Screen
            name="Profil"
            component={ProfileScreen}
            options={{
              headerTitle: 'Mój Profil',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}