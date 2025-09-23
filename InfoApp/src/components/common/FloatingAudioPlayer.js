// src/components/common/FloatingAudioPlayer.js
import { AppState } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    PanResponder,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../styles/colors';
import { audioService } from '../../services/audioService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_SIZE = 60;
const EXPANDED_HEIGHT = 120;
const BOTTOM_NAV_HEIGHT = 80;

const FloatingAudioPlayer = ({
    initialPosition = {
        x: SCREEN_WIDTH - PLAYER_SIZE - 20,
        y: SCREEN_HEIGHT - PLAYER_SIZE - BOTTOM_NAV_HEIGHT - 20
    } }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentAudio, setCurrentAudio] = useState(null);
    const [audioTitle, setAudioTitle] = useState('Audio Player');
    const appState = useRef(AppState.currentState);

    // Animacje
    const pan = useRef(new Animated.ValueXY(initialPosition)).current;
    const expandAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // PanResponder do przeciągania
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // tylko jak użytkownik naprawdę przesuwa
                return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: (evt, gestureState) => {
                pan.flattenOffset();
                const newX = gestureState.moveX < SCREEN_WIDTH / 2 ? 20 : SCREEN_WIDTH - PLAYER_SIZE - 20;
                const newY = Math.max(40, Math.min(SCREEN_HEIGHT - PLAYER_SIZE - 100, gestureState.moveY - PLAYER_SIZE / 2));
                Animated.spring(pan, {
                    toValue: { x: newX, y: newY },
                    useNativeDriver: false,
                }).start();
            },
        })
    ).current;

    useEffect(() => {
        const sub = AppState.addEventListener('change', (next) => {
            if (appState.current === 'background' && next === 'active') {
                setIsPlaying(false);
                rotateAnim.stopAnimation();
            }
            appState.current = next;
        });
        return () => sub.remove();
    }, []);

    const loadFeaturedAudio = async () => {
        try {
            setIsLoading(true);
            console.log('[Audio] Ładowanie featured audio...');
            const result = await audioService.getFeaturedAudio();
            console.log('[Audio] Wynik getFeaturedAudio:', result);

            if (result.success && result.data) {
                setCurrentAudio(result.data);
                setAudioTitle(result.data.title);
                console.log('[Audio] Załadowano audio:', result.data.file_url);
                return result.data;
            } else {
                console.log('[Audio] Brak wyróżnionego audio');
                return null;
            }
        } catch (error) {
            console.error('[Audio] Błąd przy loadFeaturedAudio:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlayPause = async () => {
        let audio = currentAudio;
        if (!audio) {
            console.log('[Audio] currentAudio puste, pobieram...');
            audio = await loadFeaturedAudio();
            if (!audio) {
                Alert.alert('Brak audio', 'Nie znaleziono pliku do odtworzenia.');
                return;
            }
        }

        console.log('[Audio] togglePlayPause audio:', audio);

        try {
            if (isPlaying) {
                console.log('[Audio] Stop kliknięty');
                rotateAnim.stopAnimation();
                setIsPlaying(false);
                Alert.alert('Audio zatrzymane', 'Odtwarzanie zostało zatrzymane');
            } else {
                const { Linking } = require('react-native');
                console.log('[Audio] Play kliknięty, sprawdzam URL:', audio.file_url);

                const canOpen = await Linking.canOpenURL(audio.file_url);
                console.log('[Audio] canOpenURL wynik:', canOpen);

                if (!canOpen) {
                    Alert.alert('Błąd', 'Nie mogę otworzyć odtwarzacza dla tego linku.');
                    return;
                }

                console.log('[Audio] Otwieram odtwarzacz dla:', audio.file_url);
                try {
                    await Linking.openURL(audio.file_url);
                    console.log('[Audio] Linking.openURL OK');
                    await Linking.openURL(audio.file_url);
                    Animated.loop(
                        Animated.timing(rotateAnim, {
                            toValue: 1,
                            duration: 3000,
                            useNativeDriver: true,
                        })
                    ).start();
                } catch (err) {
                    console.error('[Audio] Linking.openURL błąd:', err);
                    Alert.alert('Błąd', 'Nie udało się otworzyć pliku audio');
                }
            }
        } catch (error) {
            console.error('[Audio] Error toggling playback:', error);
            Alert.alert('Błąd', 'Wystąpił problem z odtwarzaniem');
        }
    };

    // Rozwijanie/zwijanie odtwarzacza
    const toggleExpand = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);

        Animated.spring(expandAnim, {
            toValue,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
        }).start();
    };

    // Animacja obrotu
    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Załaduj wyróżnione audio przy starcie komponentu
    useEffect(() => {
        loadFeaturedAudio();
    }, []);

    // Nie renderuj komponentu jeśli nie ma audio
    if (!currentAudio) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    height: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [PLAYER_SIZE, EXPANDED_HEIGHT],
                    }),
                    width: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [PLAYER_SIZE, 250],
                    }),
                },
            ]}
            {...(!isExpanded ? panResponder.panHandlers : {})}
            pointerEvents="box-none"
        >
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Collapsed View */}
                {!isExpanded && (
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={togglePlayPause}
                        onLongPress={toggleExpand}
                    >
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            {isLoading ? (
                                <Ionicons name={"play"} size={24} color={COLORS.white} />
                            ) : (
                                <Ionicons
                                    name={"play"}
                                    size={24}
                                    color={COLORS.white}
                                />
                            )}
                        </Animated.View>
                    </TouchableOpacity>
                )}

                {/* Expanded View */}
                {isExpanded && (
                    <View style={styles.expandedContent}>
                        {/* Header z przyciskiem zamknij */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={toggleExpand}>
                                <Ionicons name="chevron-down" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                            <Text style={styles.title} numberOfLines={1}>{audioTitle}</Text>
                        </View>

                        {/* Informacje o pliku */}
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoText}>Kliknij aby odtworzyć w odtwarzaczu</Text>
                            {currentAudio.description && (
                                <Text style={styles.descriptionText} numberOfLines={2}>
                                    {currentAudio.description}
                                </Text>
                            )}
                        </View>

                        {/* Controls */}
                        <View style={styles.controls}>
                            <TouchableOpacity
                                style={styles.playButton}
                                onPress={() => console.log('[Audio] NACIŚNIĘTO PLAY')}
                                onLongPress={toggleExpand}
                            >
                                {isLoading ? (
                                    <Ionicons name="refresh" size={28} color={COLORS.white} />
                                ) : (
                                    <Ionicons
                                        name={isPlaying ? "pause" : "play"}
                                        size={28}
                                        color={COLORS.white}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
    gradient: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
    },
    playButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    expandedContent: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
        flex: 1,
    },
    infoContainer: {
        marginBottom: 16,
    },
    infoText: {
        color: COLORS.white,
        fontSize: 12,
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: 8,
    },
    descriptionText: {
        color: COLORS.white,
        fontSize: 11,
        opacity: 0.7,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainPlayButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default FloatingAudioPlayer;