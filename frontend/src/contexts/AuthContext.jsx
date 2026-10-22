import axios from 'axios';
import { useState, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HttpStatusCode } from 'axios';

export const AuthContext = createContext({});

const client = axios.create({
    baseURL: 'http://localhost:8000/api/v1/users'
});

export const AuthProvider = ({ children }) => {
    const [userData, setUserData] = useState({});
    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post('/register', {
                name,
                username,
                password
            });

            if (request.status === HttpStatusCode.Created) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const request = await client.post('/login', {
                username,
                password
            });

            if (request.status === HttpStatusCode.Ok) {
                localStorage.setItem('token', request.data.token);
                router('/home');
            }
        } catch (err) {
            throw err;
        }
    };

    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
