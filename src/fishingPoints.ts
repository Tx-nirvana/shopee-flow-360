export type FishingTable = {
    id: number;
    destination: string;
};
export type FishingPoint = {
    id: number;
    tables: FishingTable[];
};
export const FISHING_POINT_COUNT = 6;
export const POINTS_STORAGE_KEY = 'shopee-flow-360:fishing-points:v2';
export function emptyFishingPoints(): FishingPoint[] {
    return Array.from({ length: FISHING_POINT_COUNT }, (_, i) => ({ id: i + 1, tables: [] }));
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
    });
    return errors;
}
export function parseFishingPoints(text: string | null): FishingPoint[] {
    try {
        const stored = JSON.parse(text ?? 'null');
        if (stored?.version !== 2 || validateFishingPoints(stored.points).length)
            return defaultFishingPoints();
        return stored.points.map((p: FishingPoint) => ({ id: p.id, tables: p.tables.map(t => ({ id: t.id, destination: t.destination.trim() })) }));
    }
    catch {
        return defaultFishingPoints();
    }
}
