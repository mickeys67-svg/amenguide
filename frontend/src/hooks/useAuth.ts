"use client";
import { useState, useEffect, useCallback } from "react";

interface AuthUser {
    id: string;
    email: string;
    name: string;
}

export function useAuth() {
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("authUser");
            if (raw) setAuthUser(JSON.parse(raw));
        } catch {
            localStorage.removeItem("authUser");
            localStorage.removeItem("authToken");
        }
        setMounted(true);

        const onStorage = (e: StorageEvent) => {
            if (e.key === "authUser" || e.key === "authToken" || e.key === null) {
                try {
                    const raw = localStorage.getItem("authUser");
                    setAuthUser(raw ? JSON.parse(raw) : null);
                } catch {
                    setAuthUser(null);
                }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const getToken = useCallback(() => localStorage.getItem("authToken"), []);

    const logout = useCallback(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setAuthUser(null);
    }, []);

    return { authUser, mounted, getToken, logout };
}
