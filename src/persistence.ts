import { newSession, type Session } from './timeline';
import { cloneConfig, validateConfig } from './parameters';
export const STORAGE_KEY = 'shopee-flow-360:session:v1';
type StorageLike = {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
};
export function browserStorage(): StorageLike | null { try {
    return globalThis.localStorage ?? null;
}
catch {
    return null;
} }
export function parseSession(text: string): Session | null {
    try {
        const s = JSON.parse(text) as Session;
        if (!s || s.version !== 1 || !['base', 'optimized', 'peak'].includes(s.scenario) || !Number.isInteger(s.minute) || s.minute < 0 || s.minute > 720 || ![1, 2, 5, 10].includes(s.speed) || validateConfig(s.config).length || !Array.isArray(s.actions) || s.actions.length > 2000)
            return null;
        let previous = -1;
        for (const a of s.actions) {
            if (!a || !Number.isInteger(a.at) || a.at < previous || a.at < 0 || a.at > 720 || !['priority', 'counter', 'dock'].includes(a.type) || (a.type === 'priority' && (!Number.isInteger(a.dockId) || a.dockId! < 1 || a.dockId! > 8)))
                return null;
            previous = a.at;
        }
        return { ...newSession(cloneConfig(s.config), s.scenario), minute: s.minute, speed: s.speed, actions: s.actions.map(a => ({ at: a.at, type: a.type, ...(a.type === 'priority' ? { dockId: a.dockId } : {}) })) };
    }
    catch {
        return null;
    }
}
export function loadSession(storage: StorageLike | null = browserStorage()): {
    session: Session;
    note: string;
} {
    if (!storage)
        return { session: newSession(), note: 'Armazenamento indisponível: progresso apenas nesta aba.' };
    try {
        const text = storage.getItem(STORAGE_KEY);
        if (!text)
            return { session: newSession(), note: '' };
        const session = parseSession(text);
        return session ? { session, note: 'Progresso restaurado. A simulação está pausada.' } : { session: newSession(), note: 'O progresso salvo era inválido ou incompatível. Iniciado um turno padrão.' };
    }
    catch {
        return { session: newSession(), note: 'Não foi possível ler o progresso salvo.' };
    }
}
export function saveSession(session: Session, storage: StorageLike | null = browserStorage()): string {
    if (!storage)
        return 'Armazenamento indisponível: progresso apenas nesta aba.';
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(session));
        return '';
    }
    catch {
        return 'Não foi possível salvar o progresso neste navegador. A simulação continua disponível.';
    }
}
