export type LeveShelf = { id: string; name: string; destination: string | null; row: number; position: number };

// Somente identificações do Layout Leve fornecido pelo usuário. Destinos não inferidos.
const names = [
    ['MG4', 'MG2', 'BETIM-1'],
    ['SP25-1', 'SP25-2', 'SC1-2'],
    ['ES', 'C3', 'PR1'],
    ['SP5 -2', 'RS-2'],
    ['BA-2', 'GO-2', 'PE-2'],
];
const mg5Rows = [
    [5, 9, 11, 15, 20, 23],
    [27, 36, 38, 39, 40, 43],
    [45, 49, 50, 56, 61, 62],
    [73, 74, 75, 76, 83, 84],
    [85, 86, 87, 88, 91, 93, 119],
    [94, 95, 96, 97, 98, 99],
];
export function defaultLeveShelves(pointId: number): LeveShelf[] {
    if (pointId === 6) return mg5Rows.flatMap((numbers, row) => numbers.map((number, position) => ({ id: 'MG5-' + number, name: 'MG5-' + number, destination: null, row: row + 1, position: position + 1 })));
    return (names[pointId - 1] ?? []).map((name, position) => ({ id: 'B' + pointId + '-' + (position + 1), name, destination: null, row: 1, position: position + 1 }));
}
export const LEVE_BLOCKS = [
    { x: -43, width: 12 }, { x: -29, width: 12 }, { x: -15, width: 12 },
    { x: -1, width: 12 }, { x: 13, width: 12 }, { x: 39, width: 34 },
];
export function shelfLocation(pointId: number, shelf: LeveShelf) {
    const block = LEVE_BLOCKS[pointId - 1];
    return pointId === 6
        ? { x: block.x + (shelf.row - 3.5) * 5, z: 2.4 + (shelf.position - 1) * 4.4 }
        : { x: block.x + (shelf.position - 2) * 3.6, z: 2.4 };
}

/** Cada identificação corresponde a uma mesa; a referência antiga não cria móveis extras. */
export function leveTablePositions(points: { id: number; shelves: LeveShelf[] }[]) {
    return points.flatMap(point => point.shelves.map(shelf => shelfLocation(point.id, shelf)));
}
