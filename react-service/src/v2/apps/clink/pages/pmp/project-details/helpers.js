import React, { useContext, useEffect } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

function normalizeSections(input) {
    if (Array.isArray(input)) return input;

    if (typeof input === 'string') {
        const s = input.trim();
        if (!s) return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    if (input && typeof input === 'object') {
        try {
            const vals = Object.values(input);
            return Array.isArray(vals) ? vals : [];
        } catch {
            return [];
        }
    }

    return [];
}

function useBlockNavigation(blocker, when = true) {
    const SafeNavContext = NavigationContext ?? React.createContext(undefined);
    const navCtx = useContext(SafeNavContext);
    const navigator = navCtx && navCtx.navigator;

    useEffect(() => {
        if (!when || !navigator || typeof navigator.block !== 'function') {
            return undefined;
        };

        const unblock = navigator.block((tx) => {
            const autoUnblockingTx = {
                ...tx,
                retry() {
                    unblock();
                    tx.retry();
                },
            };
            blocker(autoUnblockingTx);
        });

        return unblock;
    }, [navigator, blocker, when]);

    return undefined;
}

export { normalizeSections, useBlockNavigation }
