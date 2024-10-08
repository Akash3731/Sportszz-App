import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Make sure you install this package
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setAuth(parsedUser);
                // Set Axios default headers if needed
                if (parsedUser.token) {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
                }
            }
            setLoading(false);
        };

        loadUser();
    }, []);

    const login = async (userData) => {
        const { name, token } = userData; 
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setAuth(userData);
        if (userData.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('user');
        setAuth(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

