// src/components/common/Button.js
import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { TYPOGRAPHY } from '../../styles/typography';

const Button = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, outline, ghost, danger
    size = 'medium', // small, medium, large
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left', // left, right
    style,
    textStyle,
    fullWidth = false,
    gradient = true,
    ...props
}) => {
    const getButtonStyle = () => {
        const baseStyle = [styles.button];

        // Size styles
        switch (size) {
            case 'small':
                baseStyle.push(styles.buttonSmall);
                break;
            case 'large':
                baseStyle.push(styles.buttonLarge);
                break;
            default:
                baseStyle.push(styles.buttonMedium);
        }

        // Variant styles
        switch (variant) {
            case 'secondary':
                baseStyle.push(styles.buttonSecondary);
                break;
            case 'outline':
                baseStyle.push(styles.buttonOutline);
                break;
            case 'ghost':
                baseStyle.push(styles.buttonGhost);
                break;
            case 'danger':
                baseStyle.push(styles.buttonDanger);
                break;
            default:
                baseStyle.push(styles.buttonPrimary);
        }

        // State styles
        if (disabled) {
            baseStyle.push(styles.buttonDisabled);
        }

        if (fullWidth) {
            baseStyle.push(styles.buttonFullWidth);
        }

        return [...baseStyle, style];
    };

    const getTextStyle = () => {
        const baseStyle = [styles.buttonText];

        // Size text styles
        switch (size) {
            case 'small':
                baseStyle.push(styles.buttonTextSmall);
                break;
            case 'large':
                baseStyle.push(styles.buttonTextLarge);
                break;
            default:
                baseStyle.push(styles.buttonTextMedium);
        }

        // Variant text styles
        switch (variant) {
            case 'secondary':
                baseStyle.push(styles.buttonTextSecondary);
                break;
            case 'outline':
                baseStyle.push(styles.buttonTextOutline);
                break;
            case 'ghost':
                baseStyle.push(styles.buttonTextGhost);
                break;
            case 'danger':
                baseStyle.push(styles.buttonTextDanger);
                break;
            default:
                baseStyle.push(styles.buttonTextPrimary);
        }

        if (disabled) {
            baseStyle.push(styles.buttonTextDisabled);
        }

        return [...baseStyle, textStyle];
    };

    const getIconSize = () => {
        switch (size) {
            case 'small':
                return 16;
            case 'large':
                return 24;
            default:
                return 20;
        }
    };

    const getIconColor = () => {
        if (disabled) return COLORS.gray;

        switch (variant) {
            case 'secondary':
            case 'outline':
                return COLORS.primary;
            case 'ghost':
                return COLORS.textPrimary;
            case 'danger':
                return COLORS.white;
            default:
                return COLORS.white;
        }
    };

    const renderContent = () => (
        <View style={styles.contentContainer}>
            {loading && (
                <ActivityIndicator
                    size="small"
                    color={getIconColor()}
                    style={styles.loadingIndicator}
                />
            )}

            {!loading && icon && iconPosition === 'left' && (
                <Ionicons
                    name={icon}
                    size={getIconSize()}
                    color={getIconColor()}
                    style={styles.iconLeft}
                />
            )}

            {title && (
                <Text style={getTextStyle()} numberOfLines={1}>
                    {title}
                </Text>
            )}

            {!loading && icon && iconPosition === 'right' && (
                <Ionicons
                    name={icon}
                    size={getIconSize()}
                    color={getIconColor()}
                    style={styles.iconRight}
                />
            )}
        </View>
    );

    const shouldUseGradient = gradient && variant === 'primary' && !disabled;

    if (shouldUseGradient) {
        return (
            <TouchableOpacity
                onPress={onPress}
                disabled={disabled || loading}
                activeOpacity={0.8}
                style={getButtonStyle()}
                {...props}
            >
                <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientContainer}
                >
                    {renderContent()}
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={getButtonStyle()}
            {...props}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // Size styles
    buttonSmall: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 36,
    },
    buttonMedium: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 44,
    },
    buttonLarge: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        minHeight: 52,
    },

    // Variant styles
    buttonPrimary: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonSecondary: {
        backgroundColor: COLORS.white,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    buttonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    buttonGhost: {
        backgroundColor: 'transparent',
    },
    buttonDanger: {
        backgroundColor: COLORS.error,
        shadowColor: COLORS.error,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    // State styles
    buttonDisabled: {
        backgroundColor: COLORS.lightGray,
        shadowOpacity: 0,
        elevation: 0,
        borderColor: COLORS.lightGray,
    },
    buttonFullWidth: {
        width: '100%',
    },

    // Text styles
    buttonText: {
        fontWeight: '600',
        textAlign: 'center',
    },
    buttonTextSmall: {
        fontSize: 14,
        lineHeight: 18,
    },
    buttonTextMedium: {
        fontSize: 16,
        lineHeight: 20,
    },
    buttonTextLarge: {
        fontSize: 18,
        lineHeight: 22,
    },

    // Text variant styles
    buttonTextPrimary: {
        color: COLORS.white,
    },
    buttonTextSecondary: {
        color: COLORS.primary,
    },
    buttonTextOutline: {
        color: COLORS.textPrimary,
    },
    buttonTextGhost: {
        color: COLORS.primary,
    },
    buttonTextDanger: {
        color: COLORS.white,
    },
    buttonTextDisabled: {
        color: COLORS.gray,
    },

    // Content and icon styles
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    loadingIndicator: {
        marginRight: 8,
    },
});

export default Button;