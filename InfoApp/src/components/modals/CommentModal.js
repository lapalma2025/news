// src/components/modals/CommentModal.js - Ostateczna naprawa
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { commentService } from '../../services/commentService';
import { newsService } from '../../services/newsService';
import { politicianService } from '../../services/politicianService';
import { userService } from '../../services/userService';

const { width, height } = Dimensions.get('window');

const CommentModal = ({ visible, onClose, item, onCommentAdded }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingComment, setAddingComment] = useState(false);
    const [userName, setUserName] = useState('');
    const [showNameInput, setShowNameInput] = useState(true);
    const [commentsCount, setCommentsCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [commentSubscription, setCommentSubscription] = useState(null);

    useEffect(() => {
        if (visible && item) {
            initializeData();
        } else {
            // Reset stanu gdy modal się zamyka
            setComment('');
            setUserName('');
            setShowNameInput(true);
            setComments([]);
            if (commentSubscription) {
                commentService.unsubscribeFromComments(commentSubscription);
                setCommentSubscription(null);
            }
        }

        return () => {
            if (commentSubscription) {
                commentService.unsubscribeFromComments(commentSubscription);
            }
        };
    }, [visible, item]);

    const initializeData = async () => {
        try {
            const user = await userService.getCurrentUser();
            setCurrentUser(user);

            // Sprawdź czy użytkownik ma już zapisane imię
            if (user?.displayName && user.displayName !== `Anonim#${user.displayName.split('#')[1]}`) {
                setUserName(user.displayName);
                setShowNameInput(false);
            }

            setCommentsCount(item.comments_count || 0);
            await loadComments();
            setupRealtimeComments();
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    const loadComments = async () => {
        if (!item) return;

        setLoading(true);
        try {
            const postType = item.politician_name ? 'politician_post' : 'news';
            const response = await commentService.fetchComments(item.id, postType);

            if (response.success) {
                // Dodaj informacje o polubienieach do każdego komentarza
                const commentsWithLikes = await Promise.all(
                    response.data.map(async (comment) => {
                        const likesResponse = await commentService.getCommentLikesCount(comment.id);
                        const likedResponse = currentUser
                            ? await commentService.checkCommentLike(comment.id, currentUser.id)
                            : { success: false, data: false };

                        return {
                            ...comment,
                            likes: likesResponse.success ? likesResponse.data : 0,
                            isLiked: likedResponse.success ? likedResponse.data : false
                        };
                    })
                );

                setComments(commentsWithLikes);
                setCommentsCount(commentsWithLikes.length); // Ustaw prawdziwą liczbę komentarzy
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeComments = () => {
        if (!item) return;

        const postType = item.politician_name ? 'politician_post' : 'news';
        const subscription = commentService.subscribeToComments(
            item.id,
            postType,
            (payload) => {
                console.log('Real-time comment update:', payload);
                if (payload.eventType === 'INSERT') {
                    // Dodaj nowy komentarz na żywo
                    const newComment = {
                        ...payload.new,
                        likes: 0,
                        isLiked: false
                    };

                    setComments(prev => [newComment, ...prev]);
                    setCommentsCount(prev => prev + 1);

                    // Powiadom o zmianie w card
                    if (onCommentAdded) {
                        onCommentAdded(item.id, commentsCount + 1);
                    }
                }
            }
        );
        setCommentSubscription(subscription);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}m temu`;
        } else if (diffInHours < 24) {
            return `${diffInHours}h temu`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d temu`;
        }
    };

    const addComment = async () => {
        if (!comment.trim()) {
            Alert.alert('Błąd', 'Komentarz nie może być pusty');
            return;
        }

        if (!userName.trim()) {
            Alert.alert('Błąd', 'Wprowadź swoje imię');
            return;
        }

        if (!currentUser) {
            Alert.alert('Błąd', 'Błąd systemu użytkowników');
            return;
        }

        try {
            setAddingComment(true);

            const postType = item.politician_name ? 'politician_post' : 'news';

            // Zapisz imię użytkownika dla przyszłych komentarzy
            if (userName !== currentUser.displayName) {
                await userService.updateUser({ displayName: userName });
                setShowNameInput(false);
            }

            // Dodaj komentarz do Supabase
            const commentResponse = await commentService.addComment({
                post_id: item.id,
                post_type: postType,
                author_name: userName,
                content: comment,
            });

            if (commentResponse.success) {
                // Aktualizuj licznik komentarzy w tabeli głównej
                if (postType === 'news') {
                    await newsService.updateCommentsCount(item.id, true);
                } else {
                    await politicianService.updatePostCommentsCount(item.id, true);
                }

                // Aktualizuj statystyki użytkownika
                await userService.incrementComments();

                // Wyczyść formularz
                setComment('');

                Alert.alert('Sukces', 'Komentarz został dodany!');

                // Nie trzeba ręcznie dodawać komentarza - real-time subscription to zrobi
            } else {
                Alert.alert('Błąd', 'Nie udało się dodać komentarza');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            Alert.alert('Błąd', 'Wystąpił problem z dodawaniem komentarza');
        } finally {
            setAddingComment(false);
        }
    };

    const likeComment = async (commentItem) => {
        if (!currentUser) {
            Alert.alert('Info', 'Funkcja polubień wymaga zalogowania');
            return;
        }

        try {
            // Optymistyczna aktualizacja UI
            const newIsLiked = !commentItem.isLiked;
            const newLikesCount = commentItem.isLiked
                ? commentItem.likes - 1
                : commentItem.likes + 1;

            setComments(prevComments =>
                prevComments.map(c =>
                    c.id === commentItem.id
                        ? { ...c, isLiked: newIsLiked, likes: newLikesCount }
                        : c
                )
            );

            // Aktualizuj w bazie danych
            const response = await commentService.toggleCommentLike(
                commentItem.id,
                currentUser.id,
                commentItem.isLiked
            );

            if (!response.success) {
                // Rollback w przypadku błędu
                setComments(prevComments =>
                    prevComments.map(c =>
                        c.id === commentItem.id
                            ? { ...c, isLiked: commentItem.isLiked, likes: commentItem.likes }
                            : c
                    )
                );
                Alert.alert('Błąd', 'Nie udało się zaktualizować polubienia');
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Header */}
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.header}
                    >
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>
                            Komentarze ({commentsCount})
                        </Text>
                        <View style={styles.headerSpacer} />
                    </LinearGradient>

                    {/* Oryginalny post */}
                    <View style={styles.originalPost}>
                        <Text style={styles.originalTitle}>{item.title}</Text>
                        <Text style={styles.originalContent} numberOfLines={3}>
                            {item.content}
                        </Text>
                        <View style={styles.originalMeta}>
                            <Text style={styles.originalAuthor}>
                                {item.author || item.politician_name || 'Autor'}
                            </Text>
                            <Text style={styles.originalTime}>
                                {formatTime(item.created_at)}
                            </Text>
                        </View>

                        {/* Statystyki posta */}
                        <View style={styles.postStats}>
                            <View style={styles.statItem}>
                                <Ionicons name="heart" size={16} color={COLORS.like} />
                                <Text style={styles.statText}>{item.likes_count || 0} polubień</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Ionicons name="chatbubble" size={16} color={COLORS.comment} />
                                <Text style={styles.statText}>{commentsCount} komentarzy</Text>
                            </View>
                        </View>
                    </View>

                    {/* Lista komentarzy */}
                    <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
                        {loading && comments.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Ładowanie komentarzy...</Text>
                            </View>
                        ) : comments.length > 0 ? (
                            comments.map((commentItem) => (
                                <View key={commentItem.id} style={styles.commentItem}>
                                    <View style={styles.commentHeader}>
                                        <View style={styles.commentAvatar}>
                                            <Ionicons name="person" size={20} color={COLORS.primary} />
                                        </View>
                                        <View style={styles.commentInfo}>
                                            <Text style={styles.commentAuthor}>{commentItem.author_name}</Text>
                                            <Text style={styles.commentTime}>
                                                {formatTime(commentItem.created_at)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.likeButton}
                                            onPress={() => likeComment(commentItem)}
                                        >
                                            <Ionicons
                                                name={commentItem.isLiked ? "heart" : "heart-outline"}
                                                size={16}
                                                color={commentItem.isLiked ? COLORS.like : COLORS.gray}
                                            />
                                            <Text style={[
                                                styles.likeCount,
                                                { color: commentItem.isLiked ? COLORS.like : COLORS.gray }
                                            ]}>
                                                {commentItem.likes}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <Text style={styles.commentText}>{commentItem.content}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubble-outline" size={48} color={COLORS.gray} />
                                <Text style={styles.emptyStateText}>
                                    Brak komentarzy. Bądź pierwszy!
                                </Text>
                                <Text style={styles.emptyStateSubtext}>
                                    Twój komentarz może rozpocząć dyskusję
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Input do dodawania komentarzy */}
                    <View style={styles.inputContainer}>
                        {showNameInput && (
                            <View style={styles.nameInputContainer}>
                                <TextInput
                                    style={styles.nameInput}
                                    placeholder="Twoje imię lub nick..."
                                    value={userName}
                                    onChangeText={setUserName}
                                    placeholderTextColor={COLORS.gray}
                                    maxLength={30}
                                />
                                <Text style={styles.nameHint}>
                                    To imię będzie widoczne przy Twoich komentarzach
                                </Text>
                            </View>
                        )}

                        <View style={styles.commentInputRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder={`Dodaj komentarz${userName ? ` jako ${userName}` : ''}...`}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                maxLength={300}
                                placeholderTextColor={COLORS.gray}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!comment.trim() || !userName.trim() || addingComment) && styles.sendButtonDisabled
                                ]}
                                onPress={addComment}
                                disabled={!comment.trim() || !userName.trim() || addingComment}
                            >
                                {addingComment ? (
                                    <Ionicons name="hourglass" size={20} color={COLORS.white} />
                                ) : (
                                    <Ionicons name="send" size={20} color={COLORS.white} />
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputFooter}>
                            <Text style={styles.characterCount}>
                                {comment.length}/300 znaków
                            </Text>
                            {!showNameInput && userName && (
                                <TouchableOpacity
                                    onPress={() => setShowNameInput(true)}
                                    style={styles.changeNameButton}
                                >
                                    <Text style={styles.changeNameText}>Zmień imię</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        justifyContent: 'space-between',
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.white,
    },
    headerSpacer: {
        width: 38,
    },
    originalPost: {
        backgroundColor: COLORS.white,
        margin: 20,
        padding: 20,
        borderRadius: 16,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    originalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    originalContent: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    originalMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    originalAuthor: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    originalTime: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    postStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
        paddingTop: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 6,
        fontWeight: '500',
    },
    commentsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    commentItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    commentInfo: {
        flex: 1,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    commentTime: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
    },
    likeCount: {
        fontSize: 12,
        marginLeft: 4,
        fontWeight: '600',
    },
    commentText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        marginLeft: 48,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: COLORS.textLight,
        marginTop: 8,
        textAlign: 'center',
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    nameInputContainer: {
        marginBottom: 12,
    },
    nameInput: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    nameHint: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 4,
        marginLeft: 4,
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    commentInput: {
        flex: 1,
        backgroundColor: COLORS.lightGray,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 12,
        color: COLORS.textPrimary,
    },
    sendButton: {
        backgroundColor: COLORS.primary,
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: COLORS.gray,
        opacity: 0.5,
    },
    inputFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    characterCount: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    changeNameButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    changeNameText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default CommentModal;