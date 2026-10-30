import { defaultLeveShelves, type LeveShelf } from './leveLayout';
export type FishingTable = {
    id: number;
    destination: string;
};
export type FishingPoint = {
    id: number;
    tables: FishingTable[];
    shelves: LeveShelf[];
};
export const FISHING_POINT_COUNT = 6;
export const POINTS_STORAGE_KEY = 'shopee-flow-360:fishing-points:v2';
export function emptyFishingPoints(): FishingPoint[] {
    return Array.from({ length: FISHING_POINT_COUNT }, (_, i) => ({ id: i + 1, tables: [], shelves: defaultLeveShelves(i + 1) }));
}
/** Mapeamento informado pelo usuário. Não representa volumes ou produtividade. */
export function defaultFishingPoints(): FishingPoint[] {
    const points = emptyFishingPoints();
    const mapping = [
        ['SOC_BETIM', 'SOC_CONTAGEM_INDUSTRIAL', 'SOC_BETIM'],
        ['SOC_SP_GUARULHOS', 'SOC_SP_GUARULHOS', 'SOC_SP_GUARULHOS'],
        ['SOC_BETIM', 'SOC_BETIM', 'SOC_BETIM'],
    ];
    mapping.forEach((destinations, i) => { points[i].tables = destinations.map((destination, index) => ({ id: index + 1, destination })); });
    return points;
}
export function tablesFromLines(text: string): FishingTable[] {
    if (!text.trim())
        return [];
    return text.trim().split(/\r?\n/).map((destination, i) => ({ id: i + 1, destination: destination.trim() }));
}
export function validateFishingPoints(points: FishingPoint[]): string[] {
    if (!Array.isArray(points) || points.length !== FISHING_POINT_COUNT)
        return ['O layout precisa ter exatamente seis pontos de pesca.'];
    const errors: string[] = [];
    points.forEach((point, index) => {
        if (!point || point.id !== index + 1 || !Array.isArray(point.tables) || point.tables.length > 12) {
            errors.push('Ponto ' + (index + 1) + ': informe até 12 mesas, em ordem.');
            return;
        }
        point.tables.forEach((table, tableIndex) => {
            if (!table || table.id !== tableIndex + 1 || typeof table.destination !== 'string' || !table.destination.trim() || table.destination.length > 100) {
                errors.push('Ponto ' + point.id + ', mesa ' + (tableIndex + 1) + ': informe um destino de até 100 caracteres.');
            }
        });
        const reference = defaultLeveShelves(point.id);
        if (!Array.isArray(point.shelves) || point.shelves.length !== reference.length || point.shelves.some((shelf, i) =>
            !shelf || shelf.id !== reference[i].id || shelf.name !== reference[i].name || shelf.row !== reference[i].row || shelf.position !== reference[i].position ||
            (shelf.destination !== null && (typeof shelf.destination !== 'string' || !shelf.destination.trim() || shelf.destination.length > 100)))) {
            errors.push('Bloco ' + point.id + ': mantenha as identificações das shelves e informe destinos de até 100 caracteres.');
        }
    });
    return errors;
}
export function parseFishingPoints(text: string | null): FishingPoint[] {
    try {
        const stored = JSON.parse(text ?? 'null');
        if (![2, 3].includes(stored?.version) || !Array.isArray(stored.points))
            return defaultFishingPoints();
        // v2 guardava apenas destinos por mesa. Preserva-os como referência, sem associar shelves.
        const points = stored.version === 2 ? stored.points.map((p: FishingPoint) => ({ ...p, shelves: defaultLeveShelves(p.id) })) : stored.points;
        if (validateFishingPoints(points).length) return defaultFishingPoints();
        return points.map((p: FishingPoint) => ({ id: p.id, tables: p.tables.map(t => ({ id: t.id, destination: t.destination.trim() })), shelves: p.shelves.map(s => ({ ...s, destination: s.destination?.trim() || null })) }));
    }
    catch {
        return defaultFishingPoints();
    }
}
