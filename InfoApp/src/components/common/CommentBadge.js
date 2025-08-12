// src/components/common/CommentBadge.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';

const CommentBadge = ({
    count = 0,
    onPress,
    iconColor = COLORS.comment,
    textColor = COLORS.comment,
    showBadge = true
}) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Ionicons name="chatbubble-outline" size={16} color={iconColor} />
                {showBadge && count > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {count > 99 ? '99+' : count}
                        </Text>
                    </View>
                )}
            </View>
            <Text style={[styles.countText, { color: textColor }]}>
                {count}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    iconContainer: {
        position: 'relative',
        marginRight: 6,
    },
    badge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.error,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.white,
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    countText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default CommentBadge;