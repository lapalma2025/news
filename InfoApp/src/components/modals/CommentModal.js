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

const { width, height } = Dimensions.get('window');

const CommentModal = ({ visible, onClose, item }) => {
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        if (visible && item) {
            loadComments();
        }
    }, [visible, item]);

    const loadComments = async () => {
        setLoading(true);
        setTimeout(() => {
            setComments([
                {
                    id: 1,
                    author: "Anna Kowalska",
                    content: "Bardzo ciekawa inicjatywa! Kiedy można spodziewać się pierwszych rezultatów?",
                    timestamp: "2025-08-12T10:30:00Z",
                    likes: 5
                },
                {
                    id: 2,
                    author: "Piotr Nowak",
                    content: "Mam nadzieję, że to nie będzie kolejna pusta obietnica wyborcza.",
                    timestamp: "2025-08-12T11:15:00Z",
                    likes: 12
                },
                {
                    id: 3,
                    author: "Maria Wiśniewska",
                    content: "Wreszcie ktoś zajmuje się tym problemem. Popieram!",
                    timestamp: "2025-08-12T11:45:00Z",
                    likes: 8
                }
            ]);
            setLoading(false);
        }, 500);
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

    const addComment = () => {
        if (!comment.trim()) {
            Alert.alert('Błąd', 'Komentarz nie może być pusty');
            return;
        }

        if (!userName.trim()) {
            Alert.alert('Błąd', 'Wprowadź swoje imię');
            return;
        }

        const newComment = {
            id: comments.length + 1,
            author: userName,
            content: comment,
            timestamp: new Date().toISOString(),
            likes: 0
        };

        setComments([newComment, ...comments]);
        setComment('');

        Alert.alert('Sukces', 'Komentarz został dodany!');
    };

    const likeComment = (commentId) => {
        setComments(prevComments =>
            prevComments.map(c =>
                c.id === commentId ? { ...c, likes: c.likes + 1 } : c
            )
        );
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
                    <LinearGradient
                        colors={[COLORS.primary, COLORS.secondary]}
                        style={styles.header}
                    >
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={28} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Komentarze</Text>
                        <View style={styles.headerSpacer} />
                    </LinearGradient>

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
                    </View>

                    <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.commentsHeader}>
                            <Text style={styles.commentsTitle}>
                                Komentarze ({comments.length})
                            </Text>
                        </View>

                        {loading ? (
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
                                            <Text style={styles.commentAuthor}>{commentItem.author}</Text>
                                            <Text style={styles.commentTime}>
                                                {formatTime(commentItem.timestamp)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.likeButton}
                                            onPress={() => likeComment(commentItem.id)}
                                        >
                                            <Ionicons name="heart-outline" size={16} color={COLORS.like} />
                                            <Text style={styles.likeCount}>{commentItem.likes}</Text>
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
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        {!userName && (
                            <TextInput
                                style={styles.nameInput}
                                placeholder="Twoje imię..."
                                value={userName}
                                onChangeText={setUserName}
                                placeholderTextColor={COLORS.gray}
                            />
                        )}
                        <View style={styles.commentInputRow}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Dodaj komentarz..."
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                maxLength={300}
                                placeholderTextColor={COLORS.gray}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    (!comment.trim() || !userName.trim()) && styles.sendButtonDisabled
                                ]}
                                onPress={addComment}
                                disabled={!comment.trim() || !userName.trim()}
                            >
                                <Ionicons name="send" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.characterCount}>
                            {comment.length}/300 znaków
                        </Text>
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
    commentsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    commentsHeader: {
        marginBottom: 15,
    },
    commentsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
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
        padding: 4,
    },
    likeCount: {
        fontSize: 12,
        color: COLORS.like,
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
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    nameInput: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 12,
        color: COLORS.textPrimary,
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
    characterCount: {
        fontSize: 12,
        color: COLORS.textLight,
        textAlign: 'right',
        marginTop: 4,
    },
});

export default CommentModal;