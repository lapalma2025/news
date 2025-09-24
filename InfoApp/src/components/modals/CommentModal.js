import React, { useState, useEffect, useRef, useCallback } from 'react';

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
import { authService } from '../../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { commentService } from '../../services/commentService';
import { newsService } from '../../services/newsService';
import { politicianService } from '../../services/politicianService';
import { readingHistoryService } from '../../services/readingHistoryService';
import { userService } from '../../services/userService';
import { supabase } from '../../services/supabaseClient';

const { width, height } = Dimensions.get('window');

const CommentModal = ({ visible, onClose, item, onCommentAdded, onLikeUpdate }) => {
    console.log('CommentModal props received:');
    console.log('- visible:', visible);
    console.log('- onClose:', typeof onClose);
    console.log('- item:', item?.id);
    console.log('- onCommentAdded:', typeof onCommentAdded);
    console.log('- onLikeUpdate:', typeof onLikeUpdate);  //
    const isTogglingRef = useRef(false);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingComment, setAddingComment] = useState(false);
    const [userName, setUserName] = useState('');
    const [showNameInput, setShowNameInput] = useState(true);
    const [commentsCount, setCommentsCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editText, setEditText] = useState('');
    const [commentSubscription, setCommentSubscription] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [likingPost, setLikingPost] = useState(false);
    const [contentExpanded, setContentExpanded] = useState(false);
    const [isComponentMounted, setIsComponentMounted] = useState(false);

    const isPoliticianPost = () => {
        return !!(item?.politician_name || item?.infoapp_politicians);
    };

    useEffect(() => {
        if (visible && !isComponentMounted) {
            console.log('CommentModal: First mount for item:', item?.id);
            setIsComponentMounted(true);
            if (item) {
                initializeData();
            }
        } else if (!visible) {
            console.log('CommentModal: Closing, resetting state');
            setIsComponentMounted(false);
            setComment('');
            setUserName('');
            setShowNameInput(true);
            setComments([]);
            setContentExpanded(false);
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
    }, [visible, item?.id]);


    const handleCommentSubmit = useCallback(() => {
        if (!addingComment) {
            addComment();
        }
    }, [comment, userName, currentUser, item, addingComment]);

    useEffect(() => {
        if (item) {
            setLikesCount(item.likes_count || 0);
            if (currentUser?.id) {
                checkIfPostLiked(currentUser.id);
            }
        }
    }, [item, currentUser]);

    useEffect(() => {
        const { data: sub } = supabase.auth.onAuthStateChange(async () => {
            await loadCurrentUser();
        });
        return () => sub?.subscription?.unsubscribe?.();
    }, []);

    // W CommentModal.js - ZASTĄP problematyczny useEffect tym:

    useEffect(() => {
        if (visible && item && item.id) {
            const markAsRead = async () => {
                try {
                    // Lepsze określenie typu artykułu
                    const articleType = item.type === 'politician_post' ? 'politician_post' : 'news';
                    console.log('CommentModal: Marking as read:', item.id, articleType);

                    // Wywołaj nową funkcję markAsRead
                    const result = await readingHistoryService.markAsRead(item.id, articleType);

                    if (result.success) {
                        console.log('✅ Article marked as read successfully');
                    } else {
                        console.warn('⚠️ Failed to mark article as read:', result.error);
                    }

                } catch (error) {
                    console.error('❌ Error marking article as read in CommentModal:', error);
                }
            };

            markAsRead();
        }
    }, [visible, item?.id]);

    const initializeData = async () => {
        try {
            console.log('🔄 CommentModal initializeData called');
            console.log('- item received:', item);
            console.log('- item.likes_count:', item?.likes_count);
            console.log('- item.comments_count:', item?.comments_count);

            const user = await loadCurrentUser();
            setCurrentUser(user);

            // Sprawdź czy użytkownik ma już zapisane imię
            if (user?.displayName && user.displayName !== `Anonim#${user.displayName.split('#')[1]}`) {
                setUserName(user.displayName);
                setShowNameInput(false);
            }

            // POPRAWKA: Ustaw liczniki z przekazanego item
            const itemCommentsCount = item?.comments_count || 0;
            const itemLikesCount = item?.likes_count || 0;

            console.log('📊 Setting initial counts:', { comments: itemCommentsCount, likes: itemLikesCount });
            setCommentsCount(itemCommentsCount);
            setLikesCount(itemLikesCount);

            // Sprawdź stan polubienia z bazy danych (prawdziwy stan)
            if (user?.id) {
                console.log('👤 Checking if user liked post...');
                await checkIfPostLiked(user.id);
            }

            await loadComments();
            setupRealtimeComments();
        } catch (error) {
            console.error('Error initializing data:', error);
        }
    };

    const loadCurrentUser = async () => {
        let u = await authService.getCurrentUser().catch(() => null);

        if (!u) {
            // fallback na anonimowego usera
            u = { id: null, isAnonymous: true, displayName: "Anonim" };
        }

        setCurrentUser(u);

        if (u?.id) {
            const profile = await authService.getUserProfile().catch(() => null);
            if (profile?.displayName) setUserName(profile.displayName);
        } else {
            setUserName("Anonim");
        }

        return u;
    };


    const handleEditComment = (comment) => {
        setEditingComment(comment);
        setEditText(comment.content);
    };

    const handleUpdateComment = async () => {
        if (!editText.trim()) {
            Alert.alert('Błąd', 'Komentarz nie może być pusty');
            return;
        }

        try {
            const response = await commentService.updateComment(editingComment.id, {
                content: editText.trim()
            });

            if (response.success) {
                // ✅ DODAJ - zaktualizuj lokalny stan comments
                setComments(prevComments =>
                    prevComments.map(comment =>
                        comment.id === editingComment.id
                            ? { ...comment, content: editText.trim() }
                            : comment
                    )
                );

                setEditingComment(null);
                setEditText('');
                Alert.alert('Sukces', 'Komentarz został zaktualizowany!');
            } else {
                Alert.alert('Błąd', response.error || 'Nie udało się zaktualizować komentarza');
            }
        } catch (error) {
            console.error('Error updating comment:', error);
            Alert.alert('Błąd', 'Wystąpił problem z aktualizacją komentarza');
        }
    };

    // CommentModal.js
    const syncCommentsCountWithDB = async () => {
        try {
            const postType = item.politician_name ? 'politician_post' : 'news';
            const { count, error } = await supabase
                .from('infoapp_comments')
                .select('id', { count: 'exact', head: true })
                .eq('post_id', item.id)
                .eq('post_type', postType)
                .eq('is_active', true);

            if (!error) {
                const fresh = count || 0;
                setCommentsCount(fresh);
                onCommentAdded?.(item.id, fresh); // 🔔 NewsScreen zaktualizuje listę
            }
        } catch (e) {
            console.log('syncCommentsCountWithDB error', e);
        }
    };

    const handleDeleteComment = (comment) => {
        Alert.alert(
            'Usuń komentarz',
            'Czy na pewno chcesz usunąć ten komentarz?',
            [
                { text: 'Anuluj', style: 'cancel' },
                {
                    text: 'Usuń',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const resp = await commentService.deleteComment(comment.id); // soft-delete
                            if (!resp.success) {
                                Alert.alert('Błąd', resp.error || 'Nie udało się usunąć komentarza');
                                return;
                            }

                            // natychmiast usuń z listy
                            setComments(prev => prev.filter(c => c.id !== comment.id));

                            // 🔄 policz świeżo w DB i powiadom rodzica
                            await syncCommentsCountWithDB();

                            Alert.alert('Sukces', 'Komentarz został usunięty');
                        } catch (error) {
                            console.error('Error deleting comment:', error);
                            Alert.alert('Błąd', 'Wystąpił problem z usuwaniem komentarza');
                        }
                    }
                }
            ]
        );
    };

    // W CommentModal.js - upewnij się że checkIfPostLiked NIE wywołuje onLikeUpdate:
    // W CommentModal.js - ZASTĄP checkIfPostLiked() tym:
    const checkIfPostLiked = async (userId) => {
        try {
            const postType = item.politician_name ? 'politician_post' : 'news';

            const { data, error } = await supabase
                .from('infoapp_likes')
                .select('id')
                .eq('post_id', item.id)
                .eq('post_type', postType)
                .eq('user_id', userId)
                .limit(1);

            if (!error) {
                const userLiked = data.length > 0;
                console.log('👍 User liked status:', userLiked);
                setIsLiked(userLiked);

            } else {
                setIsLiked(false);
            }
        } catch (error) {
            console.error('Error checking if post liked:', error);
            setIsLiked(false);
        }
    };

    const togglePostLike = async () => {
        if (!currentUser || isTogglingRef.current) return;
        isTogglingRef.current = true;

        try {
            const postType = item.politician_name ? 'politician_post' : 'news';

            console.log('🚀 CommentModal togglePostLike START - current state:', isLiked, likesCount);

            // (Opcjonalnie) zsynchronizuj bieżący stan z DB, żeby uniknąć rozjazdów
            const { data: currentLikeStatus } = await supabase
                .from('infoapp_likes')
                .select('id')
                .eq('post_id', item.id)
                .eq('post_type', postType)
                .eq('user_id', currentUser.id)
                .limit(1);

            const actualIsLiked = (currentLikeStatus?.length ?? 0) > 0;
            if (actualIsLiked !== isLiked) {
                console.log('⚠️ Like status mismatch! Syncing UI...');
                setIsLiked(actualIsLiked);
                // Nie wykonuj toggle, pozwól userowi kliknąć ponownie
                return;
            }

            // Jedyna operacja: zawołaj serwis, który robi INSERT/DELETE i zwraca świeży likes_count
            const resp = postType === 'politician_post'
                ? await politicianService.toggleLike(item.id, currentUser.id, isLiked)
                : await newsService.toggleLike(item.id, currentUser.id, isLiked);
            // Świeża liczba z DB (po triggerze)
            let freshCount = resp?.data?.likes_count;
            if (typeof freshCount !== 'number') {
                freshCount = isLiked ? Math.max((likesCount ?? 0) - 1, 0) : (likesCount ?? 0) + 1;
            }            // Fallback, gdyby backend nic nie zwrócił:
            if (typeof freshCount !== 'number') {
                freshCount = isLiked ? Math.max((likesCount ?? 0) - 1, 0) : (likesCount ?? 0) + 1;
            }
            const nextLiked = !isLiked;
            setIsLiked(nextLiked);
            setLikesCount(freshCount);
            onLikeUpdate?.(item.id, freshCount, nextLiked);
        } catch (error) {
            console.error('CommentModal - Error toggling post like:', error);
            Alert.alert('Błąd', 'Wystąpił problem z polubieniem posta');
        } finally {
            isTogglingRef.current = false;
        }
    };


    const loadComments = async () => {
        if (!item) return;

        setLoading(true);
        try {
            const postType = item.politician_name ? 'politician_post' : 'news';
            console.log('Loading comments for:', item.id, postType);

            const response = await commentService.fetchComments(item.id, postType);

            if (response.success) {
                console.log('Loaded comments:', response.data.length);

                // Dodaj informacje o polubienieach do każdego komentarza
                const commentsWithLikes = await Promise.all(
                    response.data.map(async (commentItem) => {
                        let likes = 0;
                        let isLiked = false;

                        // POPRAWKA: Używaj prawidłowych funkcji
                        try {
                            const likesResponse = await commentService.getCommentLikesCount(commentItem.id);
                            likes = likesResponse.success ? likesResponse.data : 0;

                            if (currentUser) {
                                const likedResponse = await commentService.checkCommentLike(commentItem.id, currentUser.id);
                                isLiked = likedResponse.success ? likedResponse.data : false;
                            }
                        } catch (error) {
                            console.log('Error loading comment likes:', error);
                            // Wartości domyślne w przypadku błędu
                            likes = 0;
                            isLiked = false;
                        }

                        return {
                            ...commentItem,
                            likes: likes,
                            isLiked: isLiked
                        };
                    })
                );

                setComments(commentsWithLikes);
                setCommentsCount(commentsWithLikes.length);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        } finally {
            setLoading(false);
        }
    };

    // W CommentModal.js - ZASTĄP setupRealtimeComments tym:

    const setupRealtimeComments = () => {
        if (!item) return;

        const postType = item.politician_name ? 'politician_post' : 'news';
        console.log('🔄 Setting up real-time for:', item.id, postType);

        if (commentService.subscribeToComments) {
            const subscription = commentService.subscribeToComments(
                item.id,
                postType,
                (payload) => {
                    console.log('🔥 REAL-TIME EVENT:', payload.eventType);

                    if (payload.eventType === 'INSERT') {
                        const incoming = { ...payload.new, isTemp: false };

                        setComments(prev => {
                            const withoutTemp = prev.filter(
                                c => !(c.isTemp && c.content === incoming.content && c.author_name === incoming.author_name)
                            );
                            // sprawdź czy już istnieje ten komentarz
                            const already = withoutTemp.some(c => c.id === incoming.id);
                            return already ? withoutTemp : [incoming, ...withoutTemp];
                        });

                        setCommentsCount(prev => prev + 1);
                    }
                    else if (payload.eventType === 'UPDATE') {
                        const nowInactive = payload.new?.is_active === false;
                        if (nowInactive) {
                            setComments(prev => prev.filter(c => c.id !== payload.new.id));
                            syncCommentsCountWithDB(); // 👈 świeży count + callback do rodzica
                        } else {
                            setComments(prev =>
                                prev.map(c => c.id === payload.new.id ? { ...c, content: payload.new.content } : c)
                            );
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // Obsługa usunięcia komentarza (is_active = false)
                        setComments(prev =>
                            prev.filter(comment => comment.id !== payload.old.id)
                        );
                        setCommentsCount(prev => Math.max(prev - 1, 0));
                    }
                }
            );
            setCommentSubscription(subscription);
        }
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
        if (!currentUser || !comment.trim() || !userName.trim()) {
            Alert.alert('Błąd', 'Wypełnij wszystkie pola');
            return;
        }

        try {
            setAddingComment(true);
            const postType = item.politician_name ? 'politician_post' : 'news';

            const commentResponse = await commentService.addComment({
                post_id: item.id,
                post_type: postType,
                author_name: userName.trim(),
                content: comment.trim(),
                user_id: currentUser.id || null
            });

            if (commentResponse.success) {
                // 1) Dodaj temp od razu (Wysłano)
                const tempId = `temp-${Date.now()}`;
                const author = userName.trim();
                const contentToSend = comment.trim();

                setComments(prev => [{
                    id: tempId,
                    author_name: author,
                    content: contentToSend,
                    isTemp: true,
                    created_at: new Date().toISOString(),
                    likes: 0,
                    isLiked: false,
                }, ...prev]);

                setComment(''); // wyczyść input
                Alert.alert('Sukces', 'Komentarz został dodany!');

                // 2) Mamy już rekord z bazy (bo .insert().select() zwraca wiersz)
                const real = {
                    ...commentResponse.data,       // tu masz prawdziwe id z Supabase
                    isTemp: false,
                    likes: 0,
                    isLiked: false,
                };

                // 3) Po 1 sekundzie: usuń temp i wstaw prawdziwy — wtedy zniknie "Wysłano"
                setTimeout(() => {
                    setComments(prev => {
                        // usuń temp dopasowując po treści i autorze
                        const withoutTemp = prev.filter(
                            c => !(c.isTemp && c.content === contentToSend && c.author_name === author)
                        );
                        // uniknij duplikatu, jeśli realtime już dodał rekord
                        const already = withoutTemp.some(c => c.id === real.id);
                        return already ? withoutTemp : [real, ...withoutTemp];
                    });
                }, 1000);
            }
            else {
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

        // Sprawdź czy funkcja polubień istnieje
        if (!commentService.toggleCommentLike) {
            Alert.alert('Info', 'Funkcja polubień komentarzy nie jest jeszcze dostępna');
            return;
        }

        if (commentItem.isTemp) {
            return; // Nie można polubić tymczasowych komentarzy
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

    const shouldShowReadMore = (text) => {
        return text && text.length > 200; // To sprawdza ZNAKI, nie słowa
    };

    const getDisplayContent = (text) => {
        if (!text) return '';
        if (!shouldShowReadMore(text) || contentExpanded) {
            return text;
        }
        return text.substring(0, 200) + '...';
    };;

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
                    {/* Oryginalny post */}
                    <View style={styles.originalPost}>
                        <Text style={styles.originalTitle}>{item.title}</Text>

                        {/* Rozwijana treść */}
                        <Text style={styles.originalContent}>
                            {getDisplayContent(item.content)}
                        </Text>
                        {/* Przycisk "Czytaj więcej" / "Zwiń" */}
                        {shouldShowReadMore(item.content) && (
                            <TouchableOpacity
                                onPress={() => setContentExpanded(!contentExpanded)}
                                style={styles.readMoreButton}
                            >
                                <Text style={styles.readMoreText}>
                                    {contentExpanded ? 'Zwiń' : 'Zobacz więcej'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.originalMeta}>
                            <Text style={styles.originalAuthor}>
                                {item.author || item.politician_name || 'Autor'}
                            </Text>
                            <Text style={styles.originalTime}>
                                {formatTime(item.created_at)}
                            </Text>
                        </View>

                        {/* Statystyki posta z możliwością polubienia */}
                        {/* Statystyki posta z możliwością polubienia */}
                        {/* ✅ STATYSTYKI - tylko dla newsów, ukryte dla polityków */}
                        {!isPoliticianPost() && (
                            <View style={styles.postStats}>
                                <TouchableOpacity
                                    style={[styles.statItem, styles.likeButton]}
                                    onPress={togglePostLike}
                                    disabled={likingPost}
                                >
                                    <Ionicons
                                        name={isLiked ? "heart" : "heart-outline"}
                                        size={18}
                                        color={isLiked ? COLORS.red : COLORS.gray}
                                    />
                                    <Text style={[
                                        styles.statText,
                                        isLiked && { color: COLORS.red, fontWeight: 'bold' }
                                    ]}>
                                        {likingPost ? '...' : likesCount} polubień
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.statItem}>
                                    <Ionicons name="chatbubble" size={16} color={COLORS.primary} />
                                    <Text style={styles.statText}>{commentsCount} komentarzy</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Lista komentarzy */}
                    <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
                        {loading && comments.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Ładowanie komentarzy..</Text>
                            </View>
                        ) : comments.length > 0 ? (
                            comments.map((commentItem) => (
                                <View key={commentItem.id} style={[
                                    styles.commentItem,
                                    commentItem.isTemp && styles.tempComment
                                ]}>
                                    <View style={styles.commentHeader}>
                                        <View style={styles.commentAvatar}>
                                            <Text style={styles.commentAvatarText}>
                                                {commentItem.author_name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.commentContent}>
                                            <View style={styles.commentMeta}>
                                                <Text style={styles.commentAuthor}>{commentItem.author_name}</Text>
                                                <Text style={styles.commentTime}>
                                                    {commentItem.isTemp ? 'Wysłano' : formatTime(commentItem.created_at)}
                                                </Text>
                                                {commentItem.isTemp && (
                                                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                                                )}
                                                {currentUser?.id && commentItem.user_id && currentUser.id === commentItem.user_id && !commentItem.isTemp && (
                                                    <View style={styles.commentActions}>
                                                        <TouchableOpacity
                                                            onPress={() => handleEditComment(commentItem)}
                                                            style={styles.actionButton}
                                                        >
                                                            <Ionicons name="pencil" size={14} color={COLORS.primary} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteComment(commentItem)}
                                                            style={styles.actionButton}
                                                        >
                                                            <Ionicons name="trash" size={14} color={COLORS.danger || COLORS.red} />
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[
                                                styles.commentText,
                                                commentItem.isTemp && styles.tempCommentText
                                            ]}>
                                                {commentItem.content}
                                            </Text>
                                            {editingComment && editingComment.id === commentItem.id ? (
                                                <View style={styles.editContainer}>
                                                    <TextInput
                                                        style={styles.editInput}
                                                        value={editText}
                                                        onChangeText={setEditText}
                                                        multiline
                                                        maxLength={300}
                                                        placeholder="Edytuj komentarz..."
                                                        autoFocus
                                                    />
                                                    <View style={styles.editActions}>
                                                        <TouchableOpacity
                                                            style={[styles.editButton, styles.cancelButton]}
                                                            onPress={() => {
                                                                setEditingComment(null);
                                                                setEditText('');
                                                            }}
                                                        >
                                                            <Text style={styles.cancelButtonText}>Anuluj</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[styles.editButton, styles.saveButton]}
                                                            onPress={handleUpdateComment}
                                                        >
                                                            <Text style={styles.saveButtonText}>Zapisz</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text>
                                                </Text>
                                            )}
                                            {/* Polubienia komentarza */}
                                            {!commentItem.isTemp && (
                                                <View style={styles.commentActions}>
                                                    <TouchableOpacity
                                                        style={styles.commentLikeButton}
                                                        onPress={() => likeComment(commentItem)}
                                                    >
                                                        <Ionicons
                                                            name={commentItem.isLiked ? "heart" : "heart-outline"}
                                                            size={16}
                                                            color={commentItem.isLiked ? COLORS.red : COLORS.gray}
                                                        />
                                                        <Text style={[
                                                            styles.commentLikeText,
                                                            commentItem.isLiked && { color: COLORS.red }
                                                        ]}>
                                                            {commentItem.likes || 0}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubble-outline" size={64} color={COLORS.gray} />
                                <Text style={styles.emptyStateTitle}>
                                    Bądź pierwszy!
                                </Text>
                                <Text style={styles.emptyStateSubtext}>
                                    Twój komentarz może rozpocząć dyskusję
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Input do dodawania komentarzy */}
                    <View style={styles.inputContainer}>
                        {Boolean(currentUser?.id) ? (
                            <>
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
                                            <Ionicons name="hourglass-outline" size={20} color={COLORS.white} />
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
                            </>
                        ) : (
                            <View style={styles.loginPrompt}>
                                <Ionicons name="lock-closed" size={24} color={COLORS.gray} />
                                <Text style={styles.loginPromptTitle}>Wymagane logowanie</Text>
                                <Text style={styles.loginPromptText}>
                                    Aby dodawać komentarze, musisz być zalogowany.
                                </Text>
                                <Text style={styles.loginPromptHint}>
                                    Przejdź do zakładki Profil i zaloguj się przez Google.
                                </Text>
                            </View>
                        )}
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
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    originalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.black,
        marginBottom: 8,
    },
    originalContent: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 20,
        marginBottom: 8,
    },
    readMoreButton: {
        alignSelf: 'flex-start',
        marginBottom: 12,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.primary + '10',
        borderRadius: 12,
    },
    readMoreText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
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
        color: COLORS.gray,
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
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    statText: {
        fontSize: 14,
        color: COLORS.gray,
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
        color: COLORS.gray,
        fontSize: 16,
    },
    commentItem: {
        backgroundColor: COLORS.white,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tempComment: {
        backgroundColor: COLORS.lightGray,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.green,
    },
    editContainer: {
        marginTop: 8,
        marginBottom: 8,
    },
    editInput: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: COLORS.black,
        maxHeight: 100,
        marginBottom: 8,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    cancelButton: {
        backgroundColor: COLORS.gray,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    commentAvatarText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
    commentContent: {
        flex: 1,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
    },
    commentTime: {
        fontSize: 12,
        color: COLORS.gray,
    },
    commentText: {
        fontSize: 14,
        color: COLORS.black,
        lineHeight: 20,
        marginBottom: 8,
    },
    tempCommentText: {
        color: COLORS.black,
    },
    loginPrompt: {
        alignItems: 'center',
        paddingVertical: 2,
        paddingHorizontal: 2,
    },
    loginPromptTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 12,
        marginBottom: 8,
    },
    loginPromptText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
    },
    loginPromptHint: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentLikeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: COLORS.lightGray + '50',
    },
    commentLikeText: {
        fontSize: 12,
        color: COLORS.gray,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.black,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: COLORS.gray,
        textAlign: 'center',
    },
    inputContainer: {
        backgroundColor: COLORS.white,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
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
        color: COLORS.black,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    nameHint: {
        fontSize: 12,
        color: COLORS.gray,
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
        color: COLORS.black,
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
        color: COLORS.gray,
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