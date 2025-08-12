// src/components/politician/PoliticianList.js - Lista polityków
import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import PoliticianCard from './PoliticianCard';
import { COLORS } from '../../styles/colors';

const PoliticianList = ({
    posts,
    onRefresh,
    refreshing,
    onItemPress,
    onLike,
    ListHeaderComponent,
    ListEmptyComponent,
    ...props
}) => {
    const renderItem = ({ item }) => (
        <PoliticianCard
            post={item}
            onPress={onItemPress}
            onLike={onLike}
        />
    );

    return (
        <FlatList
            data={posts}
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

export default PoliticianList;