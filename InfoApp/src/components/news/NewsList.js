// src/components/news/NewsList.js - Lista newsów
import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import NewsCard from './NewsCard';
import { COLORS } from '../../styles/colors';

const NewsList = ({
    news,
    onRefresh,
    refreshing,
    onItemPress,
    onLike,
    ListHeaderComponent,
    ListEmptyComponent,
    ...props
}) => {
    const renderItem = ({ item }) => (
        <NewsCard
            news={item}
            onPress={onItemPress}
            onLike={onLike}
        />
    );

    return (
        <FlatList
            data={news}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[COLORS.primary]}
                    tintColor={COLORS.primary}
                />
            }
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20 }}
            {...props}
        />
    );
};

export default NewsList;