// src/components/common/Input.js
import React, { useState, forwardRef } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { TYPOGRAPHY } from '../../styles/typography';

const Input = forwardRef(({
    label,
    placeholder,
    value,
    onChangeText,
    error,
    errorMessage,
    success,
    successMessage,
    disabled = false,
    multiline = false,
    numberOfLines = 1,
    maxLength,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoCorrect = true,
    secureTextEntry = false,
    leftIcon,
    rightIcon,
    onRightIconPress,
    showPasswordToggle = false,
    style,
    inputStyle,
    containerStyle,
    labelStyle,
    required = false,
    hint,
    onFocus,
    onBlur,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus && onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur && onBlur(e);
    };

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const getInputStyle = () => {
        const baseStyle = [styles.input];

        if (isFocused) {
            baseStyle.push(styles.inputFocused);
        }

        if (error) {
            baseStyle.push(styles.inputError);
        }

        if (success) {
            baseStyle.push(styles.inputSuccess);
        }

        if (disabled) {
            baseStyle.push(styles.inputDisabled);
        }

        if (multiline) {
            baseStyle.push(styles.inputMultiline);
        }

        return [...baseStyle, inputStyle];
    };

    const getContainerStyle = () => {
        const baseStyle = [styles.container];

        if (isFocused) {
            baseStyle.push(styles.containerFocused);
        }

        if (error) {
            baseStyle.push(styles.containerError);
        }

        if (success) {
            baseStyle.push(styles.containerSuccess);
        }

        if (disabled) {
            baseStyle.push(styles.containerDisabled);
        }

        return [...baseStyle, style];
    };

    const getRightIcon = () => {
        if (showPasswordToggle && secureTextEntry) {
            return isPasswordVisible ? 'eye-off' : 'eye';
        }
        return rightIcon;
    };

    const handleRightIconPress = () => {
        if (showPasswordToggle && secureTextEntry) {
            togglePasswordVisibility();
        } else if (onRightIconPress) {
            onRightIconPress();
        }
    };

    const getCharacterCount = () => {
        if (!maxLength) return null;
        const currentLength = value ? value.length : 0;
        return `${currentLength}/${maxLength}`;
    };

    return (
        <View style={containerStyle}>
            {label && (
                <View style={styles.labelContainer}>
                    <Text style={[styles.label, labelStyle]}>
                        {label}
                        {required && <Text style={styles.required}> *</Text>}
                    </Text>
                </View>
            )}

            <View style={getContainerStyle()}>
                {leftIcon && (
                    <View style={styles.leftIconContainer}>
                        <Ionicons
                            name={leftIcon}
                            size={20}
                            color={isFocused ? COLORS.primary : COLORS.gray}
                        />
                    </View>
                )}

                <TextInput
                    ref={ref}
                    style={getInputStyle()}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.gray}
                    value={value}
                    onChangeText={onChangeText}
                    editable={!disabled}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    {...props}
                />

                {getRightIcon() && (
                    <TouchableOpacity
                        style={styles.rightIconContainer}
                        onPress={handleRightIconPress}
                        disabled={disabled}
                    >
                        <Ionicons
                            name={getRightIcon()}
                            size={20}
                            color={isFocused ? COLORS.primary : COLORS.gray}
                        />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.bottomContainer}>
                <View style={styles.messagesContainer}>
                    {error && errorMessage && (
                        <Text style={styles.errorMessage}>
                            {errorMessage}
                        </Text>
                    )}

                    {success && successMessage && (
                        <Text style={styles.successMessage}>
                            {successMessage}
                        </Text>
                    )}

                    {hint && !error && !success && (
                        <Text style={styles.hint}>
                            {hint}
                        </Text>
                    )}
                </View>

                {maxLength && (
                    <Text style={styles.characterCount}>
                        {getCharacterCount()}
                    </Text>
                )}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
    },
    containerFocused: {
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    containerError: {
        borderColor: COLORS.error,
    },
    containerSuccess: {
        borderColor: COLORS.success,
    },
    containerDisabled: {
        backgroundColor: COLORS.lightGray,
        borderColor: COLORS.lightGray,
    },

    labelContainer: {
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        lineHeight: 18,
    },
    required: {
        color: COLORS.error,
    },

    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.textPrimary,
        paddingVertical: 0, // Remove default padding
        textAlignVertical: 'top',
    },
    inputFocused: {
        // Additional styles when focused
    },
    inputError: {
        // Additional styles when error
    },
    inputSuccess: {
        // Additional styles when success
    },
    inputDisabled: {
        color: COLORS.gray,
    },
    inputMultiline: {
        paddingTop: 4,
        minHeight: 80,
    },

    leftIconContainer: {
        marginRight: 12,
        justifyContent: 'center',
    },
    rightIconContainer: {
        marginLeft: 12,
        justifyContent: 'center',
        padding: 4,
    },

    bottomContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 4,
        minHeight: 20,
    },
    messagesContainer: {
        flex: 1,
    },
    errorMessage: {
        fontSize: 12,
        color: COLORS.error,
        lineHeight: 16,
    },
    successMessage: {
        fontSize: 12,
        color: COLORS.success,
        lineHeight: 16,
    },
    hint: {
        fontSize: 12,
        color: COLORS.textLight,
        lineHeight: 16,
    },
    characterCount: {
        fontSize: 12,
        color: COLORS.textLight,
        marginLeft: 8,
    },
});

export default Input;