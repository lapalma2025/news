// src/components/legislation/FilterBar.js - Pasek filtrów dla dokumentów legislacyjnych
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';

const { width } = Dimensions.get('window');

const FilterBar = ({ filters, onFilterChange }) => {
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    const typeOptions = [
        { value: 'all', label: 'Wszystkie', icon: 'apps-outline' },
        { value: 'projekt_ustawy', label: 'Projekty ustaw', icon: 'document-text-outline' },
        { value: 'rządowy', label: 'Rządowe', icon: 'business-outline' },
        { value: 'poselski', label: 'Poselskie', icon: 'people-outline' },
        { value: 'obywatelski', label: 'Obywatelskie', icon: 'heart-outline' },
    ];

    const statusOptions = [
        { value: 'all', label: 'Wszystkie', icon: 'list-outline' },
        { value: 'nowe', label: 'Nowe (do 7 dni)', icon: 'flash-outline' },
        { value: 'aktywne', label: 'Aktywne (do miesiąca)', icon: 'play-outline' },
        { value: 'w_trakcie', label: 'W procedowaniu', icon: 'sync-outline' },
        { value: 'stare', label: 'Długotrwałe (6m-1r)', icon: 'time-outline' },
        { value: 'archiwalne', label: 'Archiwalne (>1r)', icon: 'archive-outline' },
    ];

    const handleTypeSelect = (type) => {
        onFilterChange({ ...filters, type });
        setShowTypeModal(false);
    };

    const handleStatusSelect = (status) => {
        onFilterChange({ ...filters, status });
        setShowStatusModal(false);
    };

    const getSelectedTypeLabel = () => {
        const selected = typeOptions.find(option => option.value === filters.type);
        return selected ? selected.label : 'Wszystkie';
    };

    const getSelectedStatusLabel = () => {
        const selected = statusOptions.find(option => option.value === filters.status);
        return selected ? selected.label : 'Wszystkie';
    };

    const isFiltersActive = () => {
        return filters.type !== 'all' || filters.status !== 'all';
    };

    const clearFilters = () => {
        onFilterChange({ type: 'all', status: 'all' });
    };

    const renderModal = (visible, onClose, options, selectedValue, onSelect, title) => (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.modalOption,
                                    selectedValue === option.value && styles.modalOptionSelected
                                ]}
                                onPress={() => onSelect(option.value)}
                            >
                                <View style={styles.modalOptionContent}>
                                    <Ionicons
                                        name={option.icon}
                                        size={20}
                                        color={selectedValue === option.value ? COLORS.primary : COLORS.textSecondary}
                                    />
                                    <Text style={[
                                        styles.modalOptionText,
                                        selectedValue === option.value && styles.modalOptionTextSelected
                                    ]}>
                                        {option.label}
                                    </Text>
                                </View>
                                {selectedValue === option.value && (
                                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
            >
                {/* Filtr typu */}
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filters.type !== 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setShowTypeModal(true)}
                >
                    <Ionicons
                        name="folder-outline"
                        size={16}
                        color={filters.type !== 'all' ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[
                        styles.filterButtonText,
                        filters.type !== 'all' && styles.filterButtonTextActive
                    ]}>
                        {getSelectedTypeLabel()}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={14}
                        color={filters.type !== 'all' ? COLORS.white : COLORS.primary}
                    />
                </TouchableOpacity>

                {/* Filtr statusu */}
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        filters.status !== 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setShowStatusModal(true)}
                >
                    <Ionicons
                        name="flag-outline"
                        size={16}
                        color={filters.status !== 'all' ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[
                        styles.filterButtonText,
                        filters.status !== 'all' && styles.filterButtonTextActive
                    ]}>
                        {getSelectedStatusLabel()}
                    </Text>
                    <Ionicons
                        name="chevron-down"
                        size={14}
                        color={filters.status !== 'all' ? COLORS.white : COLORS.primary}
                    />
                </TouchableOpacity>

                {/* Przycisk czyszczenia filtrów */}
                {isFiltersActive() && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={clearFilters}
                    >
                        <Ionicons name="close-circle" size={16} color={COLORS.red} />
                        <Text style={styles.clearButtonText}>Wyczyść</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Modal typu */}
            {renderModal(
                showTypeModal,
                () => setShowTypeModal(false),
                typeOptions,
                filters.type,
                handleTypeSelect,
                'Wybierz typ dokumentu'
            )}

            {/* Modal statusu */}
            {renderModal(
                showStatusModal,
                () => setShowStatusModal(false),
                statusOptions,
                filters.status,
                handleStatusSelect,
                'Wybierz status'
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingVertical: 12,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
    },
    filterButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginHorizontal: 6,
    },
    filterButtonTextActive: {
        color: COLORS.white,
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.errorLight,
        borderWidth: 1,
        borderColor: COLORS.red,
    },
    clearButtonText: {
        fontSize: 14,
        color: COLORS.red,
        fontWeight: '600',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        maxHeight: '70%',
        width: width * 0.85,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    modalContent: {
        maxHeight: 300,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    modalOptionSelected: {
        backgroundColor: COLORS.primaryLight,
    },
    modalOptionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    modalOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginLeft: 12,
    },
    modalOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default FilterBar;