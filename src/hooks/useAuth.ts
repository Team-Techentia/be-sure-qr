// @/hooks/useAuth.ts
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";

const SESSION_KEY = "admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function getInitialAuth(): boolean {
    if (typeof window === "undefined") return false; // SSR: always false
    try {
        const session = localStorage.getItem(SESSION_KEY);
        
        if (!session) {
            return false;
        }
        
        const parsed = JSON.parse(session);
        
        if (parsed.expiresAt > Date.now()) {
            return true;
        }
        
        // Session expired, remove it
        localStorage.removeItem(SESSION_KEY);
        return false;
    } catch (error) {
        // Error reading session, clean up
        try {
            localStorage.removeItem(SESSION_KEY);
        } catch (cleanupError) {
            toast.error("Error accessing local storage");
        }
        toast.error("Session data corrupted, please login again");
        return false;
    }
}

export default function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [forceUpdate, setForceUpdate] = useState(0);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Small delay to ensure localStorage is fully ready
                await new Promise(resolve => setTimeout(resolve, 100));
                const authState = getInitialAuth();
                setIsAuthenticated(authState);
            } catch (error) {
                toast.error("Error checking authentication status");
                setIsAuthenticated(false);
            } finally {
                setIsAuthLoading(false);
            }
        };
        
        checkAuth();
    }, []);

    const login = useCallback(async (username: string, password: string) => {
        try {
            // Validate input
            if (!username || !password) {
                toast.error("Username and password are required");
                return false;
            }

            if (!process.env.NEXT_PUBLIC_ADMIN_USERNAME || !process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
                toast.error("Authentication configuration error");
                return false;
            }

            if (
                username === process.env.NEXT_PUBLIC_ADMIN_USERNAME &&
                password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD
            ) {
                try {
                    const expiresAt = Date.now() + SESSION_DURATION;
                    localStorage.setItem(SESSION_KEY, JSON.stringify({ username, expiresAt }));
                    
                    // Wait to ensure localStorage operations are complete
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Verify localStorage was written correctly
                    const savedSession = localStorage.getItem(SESSION_KEY);
                    
                    if (savedSession) {
                        setIsAuthenticated(true);
                        setForceUpdate(prev => prev + 1);
                        
                        // Show success toast after state update
                        setTimeout(() => {
                            toast.success("Logged in successfully ✅");
                        }, 200);
                        
                        return true;
                    } else {
                        toast.error("Failed to save session - please try again");
                        return false;
                    }
                } catch (storageError) {
                    toast.error("Error saving login session");
                    return false;
                }
            } else {
                toast.error("Invalid username or password ❌");
                return false;
            }
        } catch (error) {
            toast.error("Login failed - please try again");
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        try {
            localStorage.removeItem(SESSION_KEY);
            setIsAuthenticated(false);
            setForceUpdate(prev => prev + 1);
            toast("Logged out", { icon: "👋" });
        } catch (error) {
            // Even if localStorage fails, update the state
            setIsAuthenticated(false);
            setForceUpdate(prev => prev + 1);
            toast.error("Error during logout, but you have been signed out");
        }
    }, []);

    return { isAuthenticated, login, logout, isAuthLoading };
}