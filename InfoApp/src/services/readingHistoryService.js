// src/services/readingHistoryService.js - UPROSZCZONY
import { supabase } from './supabaseClient';
import { userService } from './userService';

export const readingHistoryService = {
    // Oznacz artykuł jako przeczytany
    async markAsRead(articleId, articleType = 'news') {
        try {
            const user = await userService.getCurrentUser();
            if (!user) {
                console.log('No user logged in, skipping mark as read');
                return { success: true };
            }

            const tableName = articleType === 'news' ? 'infoapp_news' : 'infoapp_politician_posts';
            const readEntry = {
                user_id: user.id,
                read_at: new Date().toISOString()
            };

            console.log(`📚 Marking article ${articleId} as read in ${tableName} for user ${user.id}`);

            // Pobierz aktualną listę read_by
            const { data: articleData, error: fetchError } = await supabase
                .from(tableName)
                .select('read_by, title')
                .eq('id', articleId)
                .single();

            if (fetchError) {
                console.error('❌ Error fetching article:', fetchError);
                return { success: false, error: fetchError.message };
            }

            console.log('📖 Article data:', {
                title: articleData.title,
                currentReadBy: articleData.read_by
            });

            const currentReadBy = articleData.read_by || [];

            // Sprawdź czy użytkownik już nie przeczytał tego artykułu
            const alreadyRead = currentReadBy.some(entry => entry.user_id === user.id);

            if (alreadyRead) {
                console.log('✅ Article already marked as read by this user');
                return { success: true };
            }

            // Dodaj nowy wpis do read_by
            const updatedReadBy = [...currentReadBy, readEntry];

            console.log('📝 Updating read_by:', {
                before: currentReadBy,
                after: updatedReadBy
            });

            // Zaktualizuj artykuł
            const { error: updateError } = await supabase
                .from(tableName)
                .update({ read_by: updatedReadBy })
                .eq('id', articleId);

            if (updateError) {
                console.error('❌ Error updating read_by:', updateError);
                return { success: false, error: updateError.message };
            }

            console.log('✅ Successfully marked article as read');
            return { success: true };

        } catch (error) {
            console.error('❌ Error in markAsRead:', error);
            return { success: false, error: error.message };
        }
    },

    // Pobierz historię czytania użytkownika - NAJLEPSZA WERSJA
    async getReadingHistory(userId) {
        try {
            console.log('Loading reading history for user:', userId);

            // Strategia: pobierz wszystkie artykuły i filtruj lokalnie
            // To jest bardziej niezawodne niż skomplikowane zapytania JSON

            const [newsResult, postsResult] = await Promise.all([
                // Pobierz wszystkie aktywne newsy
                supabase
                    .from('infoapp_news')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false }),

                // Pobierz wszystkie aktywne posty polityków
                supabase
                    .from('infoapp_politician_posts')
                    .select(`
                        *,
                        infoapp_politicians (
                            name,
                            party
                        )
                    `)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
            ]);

            if (newsResult.error) {
                console.error('Error fetching news:', newsResult.error);
            }

            if (postsResult.error) {
                console.error('Error fetching posts:', postsResult.error);
            }

            // Filtruj lokalnie - tylko te które użytkownik przeczytał
            const readNews = (newsResult.data || []).filter(item => {
                const readBy = item.read_by || [];
                return readBy.some(entry => entry.user_id === userId);
            });

            const readPosts = (postsResult.data || []).filter(item => {
                const readBy = item.read_by || [];
                return readBy.some(entry => entry.user_id === userId);
            });

            console.log(`Found ${readNews.length} read news and ${readPosts.length} read posts`);

            // Przekształć dane do unified format
            const newsItems = readNews.map(item => {
                const userReadData = item.read_by.find(entry => entry.user_id === userId);
                return {
                    ...item,
                    type: 'news',
                    readAt: userReadData?.read_at || item.created_at,
                    historyId: `news-${item.id}-${userReadData?.read_at || item.created_at}`
                };
            });

            const postItems = readPosts.map(item => {
                const userReadData = item.read_by.find(entry => entry.user_id === userId);
                return {
                    ...item,
                    type: 'politician_post',
                    politician_name: item.infoapp_politicians?.name || 'Nieznany polityk',
                    politician_party: item.infoapp_politicians?.party || '',
                    readAt: userReadData?.read_at || item.created_at,
                    historyId: `post-${item.id}-${userReadData?.read_at || item.created_at}`
                };
            });

            // Połącz i posortuj według daty przeczytania
            const allItems = [...newsItems, ...postItems]
                .sort((a, b) => new Date(b.readAt) - new Date(a.readAt));

            console.log(`Total read articles: ${allItems.length}`);
            return { success: true, data: allItems };

        } catch (error) {
            console.error('Error in getReadingHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // Usuń artykuł z historii czytania - POPRAWIONA WERSJA
    async removeFromHistory(articleId, articleType, userId) {
        try {
            console.log(`🗑️ Removing article ${articleId} (${articleType}) from history for user ${userId}`);

            const tableName = articleType === 'news' ? 'infoapp_news' : 'infoapp_politician_posts';

            // Pobierz aktualną listę read_by
            const { data: articleData, error: fetchError } = await supabase
                .from(tableName)
                .select('read_by, title')
                .eq('id', articleId)
                .single();

            if (fetchError) {
                console.error('❌ Error fetching article for removal:', fetchError);
                return { success: false, error: fetchError.message };
            }

            console.log(`📖 Article "${articleData.title}" current read_by:`, articleData.read_by);

            const currentReadBy = articleData.read_by || [];

            // Usuń wpis użytkownika
            const updatedReadBy = currentReadBy.filter(entry => entry.user_id !== userId);

            console.log(`📝 Updated read_by (removed user):`, updatedReadBy);

            // Zaktualizuj artykuł
            const { error: updateError } = await supabase
                .from(tableName)
                .update({ read_by: updatedReadBy })
                .eq('id', articleId);

            if (updateError) {
                console.error('❌ Error removing from history:', updateError);
                return { success: false, error: updateError.message };
            }

            console.log('✅ Successfully removed article from history');
            return { success: true };

        } catch (error) {
            console.error('❌ Error in removeFromHistory:', error);
            return { success: false, error: error.message };
        }
    },

    // Wyczyść całą historię czytania użytkownika - POPRAWIONA WERSJA
    async clearReadingHistory(userId) {
        try {
            console.log('🗑️ Clearing reading history for user:', userId);

            // Pobierz wszystkie artykuły które użytkownik przeczytał
            const historyResult = await this.getReadingHistory(userId);

            if (!historyResult.success || !historyResult.data || historyResult.data.length === 0) {
                console.log('✅ No reading history to clear');
                return { success: true };
            }

            const readArticles = historyResult.data;
            console.log(`🔄 Clearing ${readArticles.length} articles from history`);

            // Grupuj artykuły według typu
            const newsByIds = readArticles
                .filter(article => article.type === 'news')
                .map(article => article.id);

            const postsByIds = readArticles
                .filter(article => article.type === 'politician_post')
                .map(article => article.id);

            console.log(`📰 News to clear: ${newsByIds.length}, 📜 Posts to clear: ${postsByIds.length}`);

            const updatePromises = [];

            // Usuń użytkownika z read_by wszystkich newsów naraz
            if (newsByIds.length > 0) {
                for (const newsId of newsByIds) {
                    const promise = supabase
                        .from('infoapp_news')
                        .select('read_by')
                        .eq('id', newsId)
                        .single()
                        .then(({ data, error }) => {
                            if (error || !data) return;

                            const updatedReadBy = (data.read_by || []).filter(
                                entry => entry.user_id !== userId
                            );

                            return supabase
                                .from('infoapp_news')
                                .update({ read_by: updatedReadBy })
                                .eq('id', newsId);
                        });

                    updatePromises.push(promise);
                }
            }

            // Usuń użytkownika z read_by wszystkich postów naraz
            if (postsByIds.length > 0) {
                for (const postId of postsByIds) {
                    const promise = supabase
                        .from('infoapp_politician_posts')
                        .select('read_by')
                        .eq('id', postId)
                        .single()
                        .then(({ data, error }) => {
                            if (error || !data) return;

                            const updatedReadBy = (data.read_by || []).filter(
                                entry => entry.user_id !== userId
                            );

                            return supabase
                                .from('infoapp_politician_posts')
                                .update({ read_by: updatedReadBy })
                                .eq('id', postId);
                        });

                    updatePromises.push(promise);
                }
            }

            // Wykonaj wszystkie operacje równolegle
            const results = await Promise.allSettled(updatePromises);

            // Sprawdź wyniki
            const failed = results.filter(result => result.status === 'rejected');
            if (failed.length > 0) {
                console.error('❌ Some updates failed:', failed);
                return {
                    success: false,
                    error: `Failed to clear ${failed.length} articles`
                };
            }

            console.log('✅ Successfully cleared all reading history');
            return { success: true };

        } catch (error) {
            console.error('❌ Error clearing reading history:', error);
            return { success: false, error: error.message };
        }
    },

    // Sprawdź czy artykuł został przeczytany przez użytkownika
    async isArticleRead(articleId, articleType, userId) {
        try {
            const tableName = articleType === 'news' ? 'infoapp_news' : 'infoapp_politician_posts';

            const { data, error } = await supabase
                .from(tableName)
                .select('read_by')
                .eq('id', articleId)
                .single();

            if (error) {
                console.error('Error checking if article is read:', error);
                return false;
            }

            const readBy = data.read_by || [];
            return readBy.some(entry => entry.user_id === userId);

        } catch (error) {
            console.error('Error in isArticleRead:', error);
            return false;
        }
    }
};