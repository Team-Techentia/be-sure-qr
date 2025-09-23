// @/app/qr/_components/LoginPage.tsx
"use client";
import React, { useState, useCallback } from 'react'

interface LoginPageProps {
    login: (username: string, password: string) => Promise<boolean>;
}

export default function LoginPage({ login }: LoginPageProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = useCallback(async () => {
        if (isLoggingIn) return; // Prevent double clicks
        
        setIsLoggingIn(true);
        console.log('LoginPage: Attempting login...');
        
        try {
            const success = await login(username, password);
            console.log('LoginPage: Login result:', success);
        } catch (error) {
            console.error('LoginPage: Login error:', error);
        } finally {
            setIsLoggingIn(false);
        }
    }, [login, username, password, isLoggingIn]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    }, [handleLogin]);

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">Admin Login</h2>
                
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoggingIn}
                    />
                    
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoggingIn}
                    />
                    
                    <button
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                        onClick={handleLogin}
                        disabled={isLoggingIn || !username || !password}
                    >
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                    </button>
                </div>
                
                <div className="mt-4 text-sm text-gray-600 text-center">
                    Use your admin credentials to access the QR management system
                </div>
            </div>
        </div>
    );
}