// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import HomeScreen from './src/screens/HomeScreen';
import NewsScreen from './src/screens/NewsScreen';
import PoliticiansScreen from './src/screens/PoliticiansScreen';
import LegislationScreen from './src/screens/LegislationScreen';
import ParlamentScreen from './src/screens/BudgetScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { COLORS } from './src/styles/colors';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused, color, size }) => {
  let iconName;

  switch (name) {
    case 'Główna':
      iconName = focused ? 'home' : 'home-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    case 'Newsy':
      iconName = focused ? 'newspaper' : 'newspaper-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    case 'Politycy':
      iconName = focused ? 'people' : 'people-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    case 'Ustawy':
      iconName = focused ? 'document-text' : 'document-text-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    case 'Sejm':
      // MaterialCommunityIcons ma town-hall
      return <MaterialCommunityIcons name="town-hall" size={size} color={color} />;
    case 'Profil':
      iconName = focused ? 'person' : 'person-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    default:
      return <Ionicons name="help-outline" size={size} color={color} />;
  }
};

function Tabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon name={route.name} focused={focused} color={color} size={size} />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        // KLUCZOWE: dynamiczne dopasowanie do bezpiecznego dołu
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.lightGray,
          paddingTop: 5,
          paddingBottom: Math.max(8, insets.bottom), // nie zniknie nawet bez notcha
          height: 56 + insets.bottom,                 // lekko wyższy pasek, rośnie z insets
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
          // Android: ukryj cień
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        tabBarHideOnKeyboard: true, // nie koliduj z klawiaturą
      })}
    >
      <Tab.Screen
        name="Główna"
        component={HomeScreen}
        options={{ headerTitle: 'InfoApp' }}
      />
      <Tab.Screen
        name="Newsy"
        component={NewsScreen}
        options={{ headerTitle: 'Najnowsze Newsy' }}
      />
      <Tab.Screen
        name="Politycy"
        component={PoliticiansScreen}
        options={{ headerTitle: 'Politycy' }}
      />
      <Tab.Screen
        name="Ustawy"
        component={LegislationScreen}
        options={{ headerTitle: 'Prace Legislacyjne' }}
      />
      <Tab.Screen
        name="Sejm"
        component={ParlamentScreen}
        options={{
          headerTitle: 'Sejm',
          headerStyle: {
            backgroundColor: COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ headerTitle: 'Mój Profil' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={COLORS.primary} translucent={false} />
          <Tabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
