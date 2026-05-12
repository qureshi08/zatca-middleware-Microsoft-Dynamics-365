'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Bank {
    id: string;
    name: string;
    tax_number: string;
    vat_number: string;
    api_key?: string;
    production_csid?: string;
}

interface AppContextType {
    activeBank: Bank | null;
    setActiveBank: (bank: Bank | null) => void;
    apiKey: string | null;
    setApiKey: (key: string | null) => void;
    // QuickBooks State
    qbClientId: string;
    setQbClientId: (id: string) => void;
    qbClientSecret: string;
    setQbClientSecret: (secret: string) => void;
    qbRealmId: string;
    setQbRealmId: (id: string) => void;
    qbAccessToken: string;
    setQbAccessToken: (token: string) => void;
    qbRefreshToken: string;
    setQbRefreshToken: (token: string) => void;
    qbTokenExpiresAt: number;
    setQbTokenExpiresAt: (ts: number) => void;
    qbConnected: boolean;
    setQbConnected: (connected: boolean) => void;
    isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [activeBank, setActiveBank] = useState<Bank | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // QuickBooks state
    const [qbClientId, setQbClientId] = useState('');
    const [qbClientSecret, setQbClientSecret] = useState('');
    const [qbRealmId, setQbRealmId] = useState('');
    const [qbAccessToken, setQbAccessToken] = useState('');
    const [qbRefreshToken, setQbRefreshToken] = useState('');
    const [qbTokenExpiresAt, setQbTokenExpiresAt] = useState(0);
    const [qbConnected, setQbConnected] = useState(false);

    // Initial load from localStorage
    useEffect(() => {
        const savedKey = localStorage.getItem('z3c_api_key');
        const savedBank = localStorage.getItem('z3c_active_bank');
        
        // Load QuickBooks state
        setQbClientId(localStorage.getItem('qb_client_id') || '');
        setQbClientSecret(localStorage.getItem('qb_client_secret') || '');
        setQbRealmId(localStorage.getItem('qb_realm_id') || '');
        setQbAccessToken(localStorage.getItem('qb_access_token') || '');
        setQbRefreshToken(localStorage.getItem('qb_refresh_token') || '');
        setQbTokenExpiresAt(Number(localStorage.getItem('qb_token_expires')) || 0);
        setQbConnected(localStorage.getItem('qb_connected') === 'true');

        if (savedKey) setApiKey(savedKey);
        if (savedBank) {
            try {
                setActiveBank(JSON.parse(savedBank));
            } catch (e) {
                console.error("Failed to parse saved bank", e);
            }
        }
        setIsLoading(false);
    }, []);

    // Sync to localStorage
    useEffect(() => {
        if (apiKey) localStorage.setItem('z3c_api_key', apiKey);
        else localStorage.removeItem('z3c_api_key');
    }, [apiKey]);

    useEffect(() => {
        if (activeBank) localStorage.setItem('z3c_active_bank', JSON.stringify(activeBank));
        else localStorage.removeItem('z3c_active_bank');
    }, [activeBank]);

    // Sync QuickBooks to localStorage
    useEffect(() => {
        localStorage.setItem('qb_client_id', qbClientId);
        localStorage.setItem('qb_client_secret', qbClientSecret);
        localStorage.setItem('qb_realm_id', qbRealmId);
        localStorage.setItem('qb_access_token', qbAccessToken);
        localStorage.setItem('qb_refresh_token', qbRefreshToken);
        localStorage.setItem('qb_token_expires', String(qbTokenExpiresAt));
        localStorage.setItem('qb_connected', String(qbConnected));
    }, [qbClientId, qbClientSecret, qbRealmId, qbAccessToken, qbRefreshToken, qbTokenExpiresAt, qbConnected]);

    return (
        <AppContext.Provider value={{ 
            activeBank, setActiveBank, apiKey, setApiKey, isLoading,
            qbClientId, setQbClientId, qbClientSecret, setQbClientSecret,
            qbRealmId, setQbRealmId, qbAccessToken, setQbAccessToken,
            qbRefreshToken, setQbRefreshToken, qbTokenExpiresAt, setQbTokenExpiresAt,
            qbConnected, setQbConnected
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
