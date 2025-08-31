import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    displayName: session.user.user_metadata.full_name || session.user.email,
                    isAnonymous: false,
                });
            } else {
                setUser({ isAnonymous: true, displayName: 'Anonim' });
            }
            setLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser({
                id: session.user.id,
                email: session.user.email,
                displayName: session.user.user_metadata.full_name || session.user.email,
                isAnonymous: false,
            });
        } else {
            setUser({ isAnonymous: true, displayName: 'Anonim' });
        }
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, checkUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);