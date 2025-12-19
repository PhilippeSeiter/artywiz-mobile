import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Compteurs mockés (en production, viendrait d'un store/context)
const UNREAD_ALERTS_COUNT = 5;
const NEW_DOCS_COUNT = 3;

// Composant Badge
const TabBadge = ({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// Composant Icon avec Badge
const IconWithBadge = ({ 
  name, 
  color, 
  size, 
  badgeCount 
}: { 
  name: string; 
  color: string; 
  size: number; 
  badgeCount: number;
}) => (
  <View style={{ width: size + 8, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Ionicons name={name as any} size={size} color={color} />
    <TabBadge count={badgeCount} />
  </View>
);

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Calculer la hauteur de la tab bar en fonction du safe area
  const tabBarHeight = 56 + (Platform.OS === 'ios' ? insets.bottom : 8);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: tabBarHeight,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      {/* Accueil */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* Communication avec badge */}
      <Tabs.Screen
        name="creer"
        options={{
          title: 'Communiquer',
          tabBarIcon: ({ color, size }) => (
            <IconWithBadge name="megaphone" color={color} size={size} badgeCount={NEW_DOCS_COUNT} />
          ),
        }}
      />
      
      {/* Alertes avec badge */}
      <Tabs.Screen
        name="alertes"
        options={{
          title: 'Alertes',
          tabBarIcon: ({ color, size }) => (
            <IconWithBadge name="notifications" color={color} size={size} badgeCount={UNREAD_ALERTS_COUNT} />
          ),
        }}
      />
      
      {/* Cagnotte */}
      <Tabs.Screen
        name="cagnotter"
        options={{
          title: 'Cagnotte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      
      {/* Mon compte */}
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Mon compte',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      
      {/* Hidden screens - anciennes pages gardées pour compatibilité */}
      <Tabs.Screen name="preparer" options={{ href: null }} />
      <Tabs.Screen name="publier" options={{ href: null }} />
      <Tabs.Screen name="aide" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
