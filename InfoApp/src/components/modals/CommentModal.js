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
import { supabase } from '../../services/supabaseClient';

const { width, height } = Dimensions.get('window');

const CommentModal = ({ visible, onClose, item, onCommentAdded, onLikeUpdate }) => {
    console.log('CommentModal props received:');
    console.log('- visible:', visible);
    console.log('- onClose:', typeof onClose);
    console.log('- item:', item?.id);
    console.log('- onCommentAdded:', typeof onCommentAdded);
    console.log('- onLikeUpdate:', typeof onLikeUpdate);  //
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [addingComment, setAddingComment] = useState(false);
    const [userName, setUserName] = useState('');
    const [showNameInput, setShowNameInput] = useState(true);
    const [commentsCount, setCommentsCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [commentSubscription, setCommentSubscription] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [likingPost, setLikingPost] = useState(false);
    const [contentExpanded, setContentExpanded] = useState(false);

    useEffect(() => {
        if (item) {
            setLikesCount(item.likes_count || 0);
            if (currentUser?.id) {
                checkIfPostLiked(currentUser.id);
            }
        }
    }, [item, currentUser]);

    // W CommentModal.js - ZASTĄP problematyczny useEffect tym:

    // W CommentModal.js - ZOSTAW TYLKO TEN useEffect:
    useEffect(() => {
        if (visible && item) {
            console.log('CommentModal opened for item:', item.id);
            initializeData();
        } else {
            // Reset stanu gdy modal się zamyka
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

    useEffect(() => {
        if (visible && item && item.id) {
            const markAsRead = async () => {
                try {
                    const articleType = item.type === 'politician_post' ? 'politician_post' : 'news';
                    console.log('CommentModal: Marking as read:', item.id, articleType);

                    await readingHistoryService.markAsRead(item.id, articleType);
                } catch (error) {
                    console.error('Error marking article as read in CommentModal:', error);
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

            const user = await userService.getCurrentUser();
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
        if (!currentUser || likingPost) return;

        try {
            setLikingPost(true);
            const postType = item.politician_name ? 'politician_post' : 'news';
            const tableName = postType === 'news' ? 'infoapp_news' : 'infoapp_politician_posts';

            console.log('🚀 CommentModal togglePostLike START - current state:', isLiked, likesCount);

            // ZABEZPIECZENIE: Sprawdź aktualny stan w bazie przed zmianą
            const { data: currentLikeStatus } = await supabase
                .from('infoapp_likes')
                .select('id')
                .eq('post_id', item.id)
                .eq('post_type', postType)
                .eq('user_id', currentUser.id)
                .limit(1);

            const actualIsLiked = currentLikeStatus && currentLikeStatus.length > 0;
            console.log('🔍 Actual like status in DB:', actualIsLiked, 'UI thinks:', isLiked);

            // Jeśli stan w UI nie zgadza się z bazą, synchronizuj
            if (actualIsLiked !== isLiked) {
                console.log('⚠️ Like status mismatch! Syncing...');
                setIsLiked(actualIsLiked);
                return; // Przerwij operację
            }

            // Zapisz aktualny stan przed zmianą
            const currentIsLiked = actualIsLiked;
            const newIsLiked = !currentIsLiked;
            const newLikesCount = currentIsLiked ? Math.max(likesCount - 1, 0) : likesCount + 1;

            // Optymistyczna aktualizacja UI
            setIsLiked(newIsLiked);
            setLikesCount(newLikesCount);

            let success = false;

            if (currentIsLiked) {
                // USUŃ POLUBIENIE
                console.log('🗑️ Removing like...');

                const { error } = await supabase
                    .from('infoapp_likes')
                    .delete()
                    .eq('post_id', item.id)
                    .eq('post_type', postType)
                    .eq('user_id', currentUser.id);

                if (!error) {
                    // Pobierz aktualną wartość i dekrementuj
                    const { data: currentData, error: fetchError } = await supabase
                        .from(tableName)
                        .select('likes_count')
                        .eq('id', item.id)
                        .single();

                    if (!fetchError && currentData) {
                        const actualCount = currentData.likes_count || 0;
                        const newCount = Math.max(actualCount - 1, 0);

                        const { error: updateError } = await supabase
                            .from(tableName)
                            .update({ likes_count: newCount })
                            .eq('id', item.id);

                        success = !updateError;
                        if (success) {
                            setLikesCount(newCount);
                            console.log('✅ Like removed. Count:', actualCount, '->', newCount);
                        }
                    }
                }
            } else {
                // DODAJ POLUBIENIE  
                console.log('➕ Adding like...');

                // Sprawdź czy już nie istnieje (double-check)
                const { data: doubleCheck } = await supabase
                    .from('infoapp_likes')
                    .select('id')
                    .eq('post_id', item.id)
                    .eq('post_type', postType)
                    .eq('user_id', currentUser.id)
                    .limit(1);

                if (doubleCheck && doubleCheck.length > 0) {
                    console.log('⚠️ Like already exists! Skipping...');
                    setIsLiked(true);
                    success = true;
                } else {
                    const { error } = await supabase
                        .from('infoapp_likes')
                        .insert([{
                            post_id: item.id,
                            post_type: postType,
                            user_id: currentUser.id,
                            created_at: new Date().toISOString()
                        }]);

                    if (!error || error.code === '23505') { // 23505 = duplikat
                        // Pobierz aktualną wartość i inkrementuj
                        const { data: currentData, error: fetchError } = await supabase
                            .from(tableName)
                            .select('likes_count')
                            .eq('id', item.id)
                            .single();

                        if (!fetchError && currentData) {
                            const actualCount = currentData.likes_count || 0;
                            const newCount = actualCount + 1;

                            const { error: updateError } = await supabase
                                .from(tableName)
                                .update({ likes_count: newCount })
                                .eq('id', item.id);

                            success = !updateError;
                            if (success) {
                                setLikesCount(newCount);
                                console.log('✅ Like added. Count:', actualCount, '->', newCount);
                            }
                        }
                    }
                }
            }

            if (!success) {
                // Rollback
                setIsLiked(currentIsLiked);
                setLikesCount(likesCount);
                Alert.alert('Błąd', 'Nie udało się zaktualizować polubienia');
            } else {
                // Powiadom parent
                if (onLikeUpdate) {
                    onLikeUpdate(item.id, likesCount, newIsLiked);
                }
            }

        } catch (error) {
            console.error('CommentModal - Error toggling post like:', error);
            setIsLiked(isLiked);
            setLikesCount(likesCount);
            Alert.alert('Błąd', 'Wystąpił problem z polubienie posta');
        } finally {
            setLikingPost(false);
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

    const setupRealtimeComments = () => {
        if (!item) return;

        const postType = item.politician_name ? 'politician_post' : 'news';
        console.log('Setting up real-time for:', item.id, postType);

        // Sprawdź czy funkcja istnieje
        if (commentService.subscribeToComments) {
            const subscription = commentService.subscribeToComments(
                item.id,
                postType,
                (payload) => {
                    console.log('Real-time comment update:', payload);
                    if (payload.eventType === 'INSERT') {
                        // Sprawdź czy to nie jest duplikat tymczasowego komentarza
                        const newComment = {
                            ...payload.new,
                            likes: 0,
                            isLiked: false
                        };

                        console.log('Checking for duplicate comment:', newComment.content);

                        setComments(prev => {
                            // Usuń tymczasowe komentarze o tej samej treści
                            const filtered = prev.filter(c =>
                                !(c.isTemp && c.content === newComment.content && c.author_name === newComment.author_name)
                            );

                            // Sprawdź czy komentarz już nie istnieje
                            const exists = filtered.some(c => c.id === newComment.id);
                            if (!exists) {
                                console.log('Adding real-time comment:', newComment.id);
                                return [newComment, ...filtered];
                            }

                            return filtered;
                        });

                        setCommentsCount(prev => {
                            const newCount = Math.max(prev, comments.filter(c => !c.isTemp).length + 1);
                            console.log('Real-time comments count update:', prev, '->', newCount);

                            // Powiadom parent component
                            if (onCommentAdded) {
                                console.log('Notifying parent about real-time comment');
                                onCommentAdded(item.id, newCount);
                            }

                            return newCount;
                        });
                    }
                }
            );
            setCommentSubscription(subscription);
        } else {
            console.log('Real-time subscriptions not available');
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

        const commentContent = comment.trim();
        const authorName = userName.trim();

        try {
            setAddingComment(true);

            const postType = item.politician_name ? 'politician_post' : 'news';
            console.log('Adding comment to:', item.id, postType, 'by:', authorName);

            // Zapisz imię użytkownika dla przyszłych komentarzy
            if (userName !== currentUser.displayName) {
                await userService.updateUser({ displayName: userName });
                setShowNameInput(false);
            }

            // DODAJ KOMENTARZ NATYCHMIAST DO UI (optymistyczna aktualizacja)
            const tempComment = {
                id: `temp-${Date.now()}`,
                content: commentContent,
                author_name: authorName,
                created_at: new Date().toISOString(),
                likes: 0,
                isLiked: false,
                isTemp: true // Oznacz jako tymczasowy
            };

            console.log('Adding temporary comment to UI:', tempComment);
            setComments(prev => [tempComment, ...prev]);
            setCommentsCount(prev => {
                const newCount = prev + 1;
                console.log('Temporary update comments count:', prev, '->', newCount);

                // Powiadom parent NATYCHMIAST
                if (onCommentAdded) {
                    console.log('Notifying parent about temporary comment');
                    onCommentAdded(item.id, newCount);
                }

                return newCount;
            });

            // Wyczyść formularz natychmiast
            setComment('');

            // Dodaj komentarz do Supabase
            const commentResponse = await commentService.addComment({
                post_id: item.id,
                post_type: postType,
                author_name: authorName,
                content: commentContent,
            });

            if (commentResponse.success) {
                console.log('Comment added to database successfully:', commentResponse.data);

                // BEZPOŚREDNIA AKTUALIZACJA LICZNIKA W BAZIE DANYCH
                try {
                    if (postType === 'news') {
                        // Bezpośrednia aktualizacja licznika dla newsów
                        const { error: updateError } = await supabase
                            .from('infoapp_news')
                            .update({
                                comments_count: supabase.raw('COALESCE(comments_count, 0) + 1')
                            })
                            .eq('id', item.id);

                        if (updateError) {
                            console.error('Error updating news comments count:', updateError);
                        } else {
                            console.log('News comments count updated successfully');
                        }
                    } else {
                        // Bezpośrednia aktualizacja licznika dla wpisów polityków
                        const { error: updateError } = await supabase
                            .from('infoapp_politician_posts')
                            .update({
                                comments_count: supabase.raw('COALESCE(comments_count, 0) + 1')
                            })
                            .eq('id', item.id);

                        if (updateError) {
                            console.error('Error updating politician post comments count:', updateError);
                        } else {
                            console.log('Politician post comments count updated successfully');
                        }
                    }
                } catch (dbError) {
                    console.error('Database update error:', dbError);
                }

                // Aktualizuj statystyki użytkownika
                await userService.incrementComments();

                Alert.alert('Sukces', 'Komentarz został dodany!');

                // Nie usuwaj tymczasowego komentarza - zostaw go, real-time może go zastąpić lub nie
                // Jeśli real-time nie działa, komentarz pozostanie jako tymczasowy ale będzie widoczny

                // Fallback: Jeśli nie ma real-time, zamień tymczasowy na prawdziwy
                setTimeout(() => {
                    setComments(prev => prev.map(c =>
                        c.isTemp && c.content === commentContent && c.author_name === authorName
                            ? { ...commentResponse.data, likes: 0, isLiked: false }
                            : c
                    ));
                }, 1000); // Daj czas real-time na zadziałanie

            } else {
                console.error('Failed to add comment to database');
                // Usuń tymczasowy komentarz w przypadku błędu
                setComments(prev => prev.filter(c => !(c.isTemp && c.content === commentContent)));
                setCommentsCount(prev => Math.max(0, prev - 1));

                // Cofnij aktualizację parent component
                if (onCommentAdded) {
                    onCommentAdded(item.id, commentsCount);
                }

                Alert.alert('Błąd', 'Nie udało się dodać komentarza');
            }
        } catch (error) {
            console.error('Error adding comment:', error);

            // Usuń tymczasowy komentarz w przypadku błędu
            setComments(prev => prev.filter(c => !(c.isTemp && c.content === commentContent)));
            setCommentsCount(prev => Math.max(0, prev - 1));

            // Cofnij aktualizację parent component
            if (onCommentAdded) {
                onCommentAdded(item.id, commentsCount);
            }

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
                    </View>

                    {/* Lista komentarzy */}
                    <ScrollView style={styles.commentsContainer} showsVerticalScrollIndicator={false}>
                        {loading && comments.length === 0 ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>Ładowanie komentarzy...</Text>
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
                                            </View>
                                            <Text style={[
                                                styles.commentText,
                                                commentItem.isTemp && styles.tempCommentText
                                            ]}>
                                                {commentItem.content}
                                            </Text>

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