// src/services/audioService.js
import { supabase, handleSupabaseError, handleSupabaseSuccess, getCurrentTimestamp } from './supabaseClient';

export const audioService = {
    // Pobierz wszystkie aktywne pliki audio
    async fetchAudioFiles() {
        try {
            const { data, error } = await supabase
                .from('infoapp_audio')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'fetchAudioFiles');
        } catch (error) {
            return handleSupabaseError(error, 'fetchAudioFiles');
        }
    },

    // Pobierz wyróżnione audio (dla odtwarzacza)
    async getFeaturedAudio() {
        try {
            const { data, error } = await supabase
                .from('infoapp_audio')
                .select('*')
                .eq('is_active', true)
                .eq('is_featured', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error) {
                // Jeśli nie ma wyróżnionego, pobierz najnowsze
                const { data: latestData, error: latestError } = await supabase
                    .from('infoapp_audio')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (latestError) throw latestError;
                return handleSupabaseSuccess(latestData, 'getFeaturedAudio');
            }

            return handleSupabaseSuccess(data, 'getFeaturedAudio');
        } catch (error) {
            return handleSupabaseError(error, 'getFeaturedAudio');
        }
    },

    // Upload pliku MP3 do Supabase Storage
    async uploadAudioFile(file, fileName) {
        try {
            // Generuj unikalną nazwę pliku
            const fileExt = fileName.split('.').pop();
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

            // Upload do Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audio')
                .upload(uniqueFileName, file, {
                    contentType: 'audio/mpeg',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Pobierz publiczny URL
            const { data: urlData } = supabase.storage
                .from('audio')
                .getPublicUrl(uniqueFileName);

            return handleSupabaseSuccess({
                path: uploadData.path,
                publicUrl: urlData.publicUrl,
                fileName: uniqueFileName
            }, 'uploadAudioFile');

        } catch (error) {
            return handleSupabaseError(error, 'uploadAudioFile');
        }
    },

    // Dodaj rekord audio do bazy danych
    async addAudioRecord(audioData) {
        try {
            const { data, error } = await supabase
                .from('infoapp_audio')
                .insert([{
                    title: audioData.title,
                    description: audioData.description || null,
                    file_url: audioData.file_url,
                    file_name: audioData.file_name,
                    file_size: audioData.file_size || null,
                    duration: audioData.duration || null,
                    is_featured: audioData.is_featured || false,
                    created_at: getCurrentTimestamp(),
                    is_active: true
                }])
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'addAudioRecord');
        } catch (error) {
            return handleSupabaseError(error, 'addAudioRecord');
        }
    },

    // Kompletny proces dodawania audio (upload + zapis do DB)
    async addAudio(file, audioData) {
        try {
            // Upload pliku
            const uploadResult = await this.uploadAudioFile(file, audioData.file_name);
            if (!uploadResult.success) {
                return uploadResult;
            }

            // Dodaj rekord do bazy
            const recordData = {
                ...audioData,
                file_url: uploadResult.data.publicUrl,
                file_name: uploadResult.data.fileName,
                file_size: file.size
            };

            const dbResult = await this.addAudioRecord(recordData);
            if (!dbResult.success) {
                // Jeśli zapis do DB się nie udał, usuń plik z Storage
                await this.deleteAudioFile(uploadResult.data.fileName);
                return dbResult;
            }

            return handleSupabaseSuccess({
                ...dbResult.data,
                file_path: uploadResult.data.path
            }, 'addAudio');

        } catch (error) {
            return handleSupabaseError(error, 'addAudio');
        }
    },

    // Usuń plik audio z Storage
    async deleteAudioFile(fileName) {
        try {
            const { error } = await supabase.storage
                .from('audio')
                .remove([fileName]);

            if (error) throw error;
            return handleSupabaseSuccess(null, 'deleteAudioFile');
        } catch (error) {
            return handleSupabaseError(error, 'deleteAudioFile');
        }
    },

    // Usuń audio (z DB i Storage)
    async deleteAudio(audioId) {
        try {
            // Najpierw pobierz dane pliku
            const { data: audioData, error: fetchError } = await supabase
                .from('infoapp_audio')
                .select('file_name')
                .eq('id', audioId)
                .single();

            if (fetchError) throw fetchError;

            // Usuń z bazy danych (soft delete)
            const { data, error } = await supabase
                .from('infoapp_audio')
                .update({ is_active: false })
                .eq('id', audioId)
                .select();

            if (error) throw error;

            // Usuń plik z Storage
            await this.deleteAudioFile(audioData.file_name);

            return handleSupabaseSuccess(data[0], 'deleteAudio');
        } catch (error) {
            return handleSupabaseError(error, 'deleteAudio');
        }
    },

    // Aktualizuj status "featured"
    async toggleFeatured(audioId, isFeatured) {
        try {
            // Jeśli ustawiamy jako featured, usuń featured z innych
            if (isFeatured) {
                await supabase
                    .from('infoapp_audio')
                    .update({ is_featured: false })
                    .neq('id', audioId);
            }

            const { data, error } = await supabase
                .from('infoapp_audio')
                .update({ is_featured: isFeatured })
                .eq('id', audioId)
                .select();

            if (error) throw error;
            return handleSupabaseSuccess(data[0], 'toggleFeatured');
        } catch (error) {
            return handleSupabaseError(error, 'toggleFeatured');
        }
    },

    // Wyszukaj pliki audio
    async searchAudio(query) {
        try {
            const { data, error } = await supabase
                .from('infoapp_audio')
                .select('*')
                .eq('is_active', true)
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return handleSupabaseSuccess(data, 'searchAudio');
        } catch (error) {
            return handleSupabaseError(error, 'searchAudio');
        }
    },

    // Pobierz publiczny URL dla pliku
    getPublicUrl(fileName) {
        const { data } = supabase.storage
            .from('audio')
            .getPublicUrl(fileName);

        return data.publicUrl;
    }
};