// src/components/modals/AddNewsModal.js - Modal dodawania newsów
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../common/Button';
import Input from '../common/Input';
import { COLORS } from '../../styles/colors';
import { newsService } from '../../services/newsService';

const AddNewsModal = ({ visible, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title || !content || !author || !category) {
            Alert.alert('Błąd', 'Wszystkie pola są wymagane');
            return;
        }

        setLoading(true);
        try {
            const response = await newsService.addNews({
                title,
                content,
                author,
                category,
            });

            if (response.success) {
                Alert.alert('Sukces', 'News został dodany pomyślnie!');
                setTitle('');
                setContent('');
                setAuthor('');
                setCategory('');
                onSuccess && onSuccess();
                onClose();
            } else {
                Alert.alert('Błąd', 'Nie udało się dodać newsa');
            }
        } catch (error) {
            Alert.alert('Błąd', 'Wystąpił problem z połączeniem');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.header}>
                    <Button
                        title="Anuluj"
                        variant="ghost"
                        onPress={onClose}
                    />
                    <Text style={styles.title}>Dodaj News</Text>
                    <View style={{ width: 60 }} />
                </View>

                <View style={styles.form}>
                    <Input
                        label="Tytuł"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Wprowadź tytuł newsa"
                        required
                    />

                    <Input
                        label="Kategoria"
                        value={category}
                        onChangeText={setCategory}
                        placeholder="np. Polityka, Sport"
                        required
                    />

                    <Input
                        label="Autor"
                        value={author}
                        onChangeText={setAuthor}
                        placeholder="Imię i nazwisko autora"
                        required
                    />

                    <Input
                        label="Treść"
                        value={content}
                        onChangeText={setContent}
                        placeholder="Wprowadź treść newsa"
                        multiline
                        numberOfLines={6}
                        required
                    />

                    <Button
                        title="Dodaj News"
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        style={{ marginTop: 20 }}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    form: {
        flex: 1,
        padding: 20,
    },
});

export default AddNewsModal;