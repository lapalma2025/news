// src/components/common/TabBar.js - Uniwersalny TabBar
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';

const TabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.container}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel || options.title || route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        style={styles.tab}
                    >
                        <Ionicons
                            name={getIconName(route.name, isFocused)}
                            size={24}
                            color={isFocused ? COLORS.primary : COLORS.gray}
                        />
                        <Text style={[styles.label, { color: isFocused ? COLORS.primary : COLORS.gray }]}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const getIconName = (routeName, focused) => {
    switch (routeName) {
        case 'Główna': return focused ? 'home' : 'home-outline';
        case 'Newsy': return focused ? 'newspaper' : 'newspaper-outline';
        case 'Politycy': return focused ? 'people' : 'people-outline';
        case 'Profil': return focused ? 'person' : 'person-outline';
        default: return 'help-outline';
    }
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingBottom: 20,
        paddingTop: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default TabBar;