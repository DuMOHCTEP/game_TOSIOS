// ПРИМЕР: Как создать карту small для TOSIOS
// Это JavaScript код, который показывает процесс создания карты

// Размер карты small: 16x16 тайлов
const MAP_SIZE = 16;

// Создаем пустые слои (массивы по 256 элементов: 16x16)
function createEmptyLayer() {
    return new Array(MAP_SIZE * MAP_SIZE).fill(0);
}

// Слой земли (ground) - основной фон
const groundLayer = createEmptyLayer();
// Заполняем края тайлами земли (тайлы 27-31)
for (let i = 0; i < MAP_SIZE; i++) {
    for (let j = 0; j < MAP_SIZE; j++) {
        const index = i * MAP_SIZE + j;
        // Верхняя и нижняя границы
        if (i === 0 || i === MAP_SIZE - 1) {
            groundLayer[index] = 27 + (j % 5); // 27, 28, 29, 30, 31
        }
        // Левая и правая границы
        else if (j === 0 || j === MAP_SIZE - 1) {
            groundLayer[index] = 27 + (i % 5);
        }
        // Внутренняя область - случайные тайлы земли
        else {
            groundLayer[index] = 27 + Math.floor(Math.random() * 14); // 27-40
        }
    }
}

// Слой стен (walls) - препятствия
const wallsLayer = createEmptyLayer();
// Добавляем несколько стен в случайных местах
const wallPositions = [
    [6, 7], [9, 7], [1, 6], [14, 6], [7, 1], [8, 14]
];
wallPositions.forEach(([x, y]) => {
    wallsLayer[y * MAP_SIZE + x] = 9; // Вертикальная стена
});

// Слой декора (decor) - декоративные элементы
const decorLayer = createEmptyLayer();
// Добавляем немного декора
decorLayer[5 * MAP_SIZE + 5] = 84; // Декоративный элемент 1
decorLayer[10 * MAP_SIZE + 10] = 85; // Декоративный элемент 2

// Слой спавнеров (spawners) - зоны спавна игроков
const spawnersLayer = createEmptyLayer();
// Заполняем края тайлами спавнеров (тайл 100)
for (let i = 0; i < MAP_SIZE; i++) {
    for (let j = 0; j < MAP_SIZE; j++) {
        const index = i * MAP_SIZE + j;
        // Только края карты (первые и последние 2 ряда/колонки)
        if (i < 2 || i >= MAP_SIZE - 2 || j < 2 || j >= MAP_SIZE - 2) {
            spawnersLayer[index] = 100; // Тайл спавнера
        }
    }
}

// Слой коллизий (collisions) - физические препятствия
const collisionsLayer = createEmptyLayer();
// Копируем стены в слой коллизий
wallsLayer.forEach((tile, index) => {
    if (tile !== 0) {
        collisionsLayer[index] = tile;
    }
});

// Создаем итоговую карту в формате Tiled JSON
const mapData = {
    "height": MAP_SIZE,
    "width": MAP_SIZE,
    "tileheight": 16,
    "tilewidth": 16,
    "orientation": "orthogonal",
    "renderorder": "right-down",
    "layers": [
        {
            "name": "ground",
            "type": "tilelayer",
            "opacity": 1,
            "visible": true,
            "width": MAP_SIZE,
            "height": MAP_SIZE,
            "x": 0,
            "y": 0,
            "data": groundLayer
        },
        {
            "name": "walls",
            "type": "tilelayer",
            "opacity": 1,
            "visible": true,
            "width": MAP_SIZE,
            "height": MAP_SIZE,
            "x": 0,
            "y": 0,
            "data": wallsLayer
        },
        {
            "name": "decor",
            "type": "tilelayer",
            "opacity": 1,
            "visible": true,
            "width": MAP_SIZE,
            "height": MAP_SIZE,
            "x": 0,
            "y": 0,
            "data": decorLayer
        },
        {
            "name": "spawners",
            "type": "tilelayer",
            "opacity": 1,
            "visible": false,
            "width": MAP_SIZE,
            "height": MAP_SIZE,
            "x": 0,
            "y": 0,
            "data": spawnersLayer
        },
        {
            "name": "collisions",
            "type": "tilelayer",
            "opacity": 1,
            "visible": false,
            "width": MAP_SIZE,
            "height": MAP_SIZE,
            "x": 0,
            "y": 0,
            "data": collisionsLayer
        }
    ],
    "tilesets": [
        {
            "name": "dungeon",
            "image": "dungeon.png",
            "imagewidth": 176,
            "imageheight": 176,
            "tilewidth": 16,
            "tileheight": 16,
            "tilecount": 121,
            "columns": 11,
            "firstgid": 1,
            "tiles": [
                // Анимированные тайлы (вода, огонь и т.д.)
                {
                    "id": 0,
                    "animation": [
                        {"duration": 200, "tileid": 0},
                        {"duration": 200, "tileid": 1},
                        {"duration": 200, "tileid": 2},
                        {"duration": 200, "tileid": 3}
                    ]
                }
                // ... остальные тайлы с типами коллизий
            ]
        }
    ]
};

console.log("Карта small создана!");
console.log("Размер:", MAP_SIZE + "x" + MAP_SIZE, "тайлов");
console.log("Всего тайлов в спрайте:", 121);
console.log("JSON карты:", JSON.stringify(mapData, null, 2));
