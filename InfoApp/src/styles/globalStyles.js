import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from './colors';
import { TYPOGRAPHY } from './typography';

const { width, height } = Dimensions.get('window');

export const GLOBAL_STYLES = StyleSheet.create({
    // Containers
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    safeContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 20,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },

    // Cards
    card: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    smallCard: {
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },

    // Buttons
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    secondaryButton: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Button texts
    primaryButtonText: {
        ...TYPOGRAPHY.styles.button,
        color: COLORS.white,
    },
    secondaryButtonText: {
        ...TYPOGRAPHY.styles.button,
        color: COLORS.primary,
    },
    outlineButtonText: {
        ...TYPOGRAPHY.styles.button,
        color: COLORS.textPrimary,
    },

    // Inputs
    input: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputFocused: {
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
    inputError: {
        borderColor: COLORS.error,
    },

    // Typography
    h1: {
        ...TYPOGRAPHY.styles.h1,
        color: COLORS.textPrimary,
    },
    h2: {
        ...TYPOGRAPHY.styles.h2,
        color: COLORS.textPrimary,
    },
    h3: {
        ...TYPOGRAPHY.styles.h3,
        color: COLORS.textPrimary,
    },
    h4: {
        ...TYPOGRAPHY.styles.h4,
        color: COLORS.textPrimary,
    },
    h5: {
        ...TYPOGRAPHY.styles.h5,
        color: COLORS.textPrimary,
    },
    h6: {
        ...TYPOGRAPHY.styles.h6,
        color: COLORS.textPrimary,
    },
    body: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textPrimary,
    },
    bodySecondary: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textSecondary,
    },
    caption: {
        ...TYPOGRAPHY.styles.caption,
        color: COLORS.textLight,
    },
    label: {
        ...TYPOGRAPHY.styles.label,
        color: COLORS.textPrimary,
    },

    // Spacing
    marginTop: {
        marginTop: 16,
    },
    marginBottom: {
        marginBottom: 16,
    },
    marginVertical: {
        marginVertical: 16,
    },
    marginHorizontal: {
        marginHorizontal: 20,
    },
    paddingTop: {
        paddingTop: 16,
    },
    paddingBottom: {
        paddingBottom: 16,
    },
    paddingVertical: {
        paddingVertical: 16,
    },
    paddingHorizontal: {
        paddingHorizontal: 20,
    },

    // Flex
    row: {
        flexDirection: 'row',
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    flex1: {
        flex: 1,
    },

    // Shadows
    shadow: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    shadowLarge: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },

    // Borders
    borderTop: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    borderAll: {
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    // Status styles
    errorText: {
        ...TYPOGRAPHY.styles.caption,
        color: COLORS.error,
        marginTop: 4,
    },
    successText: {
        ...TYPOGRAPHY.styles.caption,
        color: COLORS.success,
        marginTop: 4,
    },
    warningText: {
        ...TYPOGRAPHY.styles.caption,
        color: COLORS.warning,
        marginTop: 4,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textSecondary,
        marginTop: 16,
    },

    // Empty states
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        ...TYPOGRAPHY.styles.h4,
        color: COLORS.textPrimary,
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateText: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
});

export const responsiveWidth = (percentage) => {
    return (width * percentage) / 100;
};

export const responsiveHeight = (percentage) => {
    return (height * percentage) / 100;
};

export const responsiveFontSize = (size) => {
    const scale = width / 375;
    const newSize = size * scale;
    return Math.max(12, Math.min(newSize, 30));
};