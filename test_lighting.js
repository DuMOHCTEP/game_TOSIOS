// Тестовый файл для проверки работы освещения
console.log('=== ТЕСТИРОВАНИЕ СИСТЕМЫ ОСВЕЩЕНИЯ ===');

// Проверяем константы
const Constants = require('./packages/common/dist/index.js');

console.log('LIGHTING_ENABLED:', Constants.LIGHTING_ENABLED);
console.log('PLAYER_LIGHT_RADIUS:', Constants.PLAYER_LIGHT_RADIUS);
console.log('DARKNESS_ALPHA:', Constants.DARKNESS_ALPHA);

// Проверяем структуру файлов
const fs = require('fs');
const path = require('path');

const clientDist = './packages/client/dist';
const serverDist = './packages/server/dist';

console.log('Client dist exists:', fs.existsSync(clientDist));
console.log('Server dist exists:', fs.existsSync(serverDist));

// Проверяем карту
const dungeonMap = './packages/client/src/game/assets/images/maps/dungeon.png';
console.log('Dungeon map exists:', fs.existsSync(dungeonMap));

console.log('=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
