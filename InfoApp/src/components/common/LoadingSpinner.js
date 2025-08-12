// src/components/common/LoadingSpinner.js
import React from 'react';
import {
    View,
    ActivityIndicator,
    Text,
    StyleSheet,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { TYPOGRAPHY } from '../../styles/typography';

const LoadingSpinner = ({
    visible = true,
    size = 'large', // small, large
    color = COLORS.primary,
    text,
    overlay = false,
    modal = false,
    style,
    textStyle,
    backgroundColor = 'transparent',
    ...props
}) => {
    const getSpinnerSize = () => {
        switch (size) {
            case 'small':
                return 'small';
            default:
                return 'large';
        }
    };

    const renderSpinner = () => (
        <View style={[styles.container, { backgroundColor }, style]}>
            <View style={styles.spinnerContainer}>
                <ActivityIndicator
                    size={getSpinnerSize()}
                    color={color}
                    {...props}
                />
                {text && (
                    <Text style={[styles.text, textStyle]}>
                        {text}
                    </Text>
                )}
            </View>
        </View>
    );

    const renderOverlaySpinner = () => (
        <View style={styles.overlay}>
            <View style={styles.overlayContent}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.95)', 'rgba(248,250,255,0.95)']}
                    style={styles.overlayGradient}
                >
                    <ActivityIndicator
                        size={getSpinnerSize()}
                        color={color}
                        {...props}
                    />
                    {text && (
                        <Text style={[styles.overlayText, textStyle]}>
                            {text}
                        </Text>
                    )}
                </LinearGradient>
            </View>
        </View>
    );

    const renderModalSpinner = () => (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <LinearGradient
                        colors={[COLORS.white, COLORS.background]}
                        style={styles.modalGradient}
                    >
                        <ActivityIndicator
                            size={getSpinnerSize()}
                            color={color}
                            {...props}
                        />
                        {text && (
                            <Text style={[styles.modalText, textStyle]}>
                                {text}
                            </Text>
                        )}
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );

    if (!visible) return null;

    if (modal) {
        return renderModalSpinner();
    }

    if (overlay) {
        return renderOverlaySpinner();
    }

    return renderSpinner();
};

// Predefiniowane komponenty dla różnych przypadków użycia
export const InlineLoader = ({ text = 'Ładowanie...', ...props }) => (
    <LoadingSpinner
        size="small"
        text={text}
        style={styles.inlineLoader}
        {...props}
    />
);

export const FullScreenLoader = ({ text = 'Ładowanie danych...', ...props }) => (
    <LoadingSpinner
        overlay
        text={text}
        {...props}
    />
);

export const ModalLoader = ({ text = 'Proszę czekać...', ...props }) => (
    <LoadingSpinner
        modal
        text={text}
        {...props}
    />
);

export const ButtonLoader = ({ ...props }) => (
    <LoadingSpinner
        size="small"
        color={COLORS.white}
        style={styles.buttonLoader}
        {...props}
    />
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    spinnerContainer: {
        alignItems: 'center',
    },
    text: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textSecondary,
        marginTop: 16,
        textAlign: 'center',
    },

    // Overlay styles
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: 999,
    },
    overlayContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlayGradient: {
        padding: 30,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    overlayText: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textPrimary,
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalGradient: {
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        minWidth: 200,
        shadowColor: COLORS.cardShadow,
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 12,
    },
    modalText: {
        ...TYPOGRAPHY.styles.body,
        color: COLORS.textPrimary,
        marginTop: 20,
        textAlign: 'center',
        fontWeight: '600',
    },

    // Specific use case styles
    inlineLoader: {
        paddingVertical: 40,
    },
    buttonLoader: {
        paddingVertical: 0,
        paddingHorizontal: 0,
    },
});

export default LoadingSpinner;