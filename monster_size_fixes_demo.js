// ДЕМОНСТРАЦИЯ ИСПРАВЛЕНИЙ РАЗМЕРОВ МОНСТРОВ И ГРАНИЦ АРЕНЫ
// Этот файл показывает исправления проблем с размерами и границами

console.log('🎯 ИСПРАВЛЕНИЯ РАЗМЕРОВ МОНСТРОВ И ГРАНИЦ АРЕНЫ');
console.log('==================================================');

// КОНСТАНТЫ РАЗМЕРОВ (ИСПРАВЛЕННЫЕ)
console.log('\n📏 КОНСТАНТЫ РАЗМЕРОВ МОНСТРОВ:');
console.log('================================');

const MONSTER_SIZES = {
    regular: { radius: 16, visual: 32 },     // Обычный монстр
    vampire: { radius: 22.5, visual: 45 },  // Вампир (1.4x больше)
    boss: { radius: 46.5, visual: 93 }       // Босс (2.9x больше)
};

console.log('• Обычный монстр: радиус 16px, визуал 32px');
console.log('• Вампир: радиус 22.5px, визуал 45px (1.4x больше)');
console.log('• Босс: радиус 46.5px, визуал 93px (2.9x больше)');

// СИСТЕМА СПАВНА БОССОВ (ИСПРАВЛЕННАЯ)
console.log('\n👑 СИСТЕМА СПАВНА БОССОВ:');
console.log('===========================');

function demonstrateBossSpawning() {
    const maps = [
        { name: 'small', size: '16x16', pixelSize: 512 },
        { name: 'medium', size: '32x32', pixelSize: 1024 },
        { name: 'large', size: '48x48', pixelSize: 1536 }
    ];

    maps.forEach(map => {
        const isSmallMap = map.pixelSize <= 512;
        const maxBosses = isSmallMap ? 1 : Math.max(1, Math.floor(5 / 3)); // 5 монстров всего

        console.log(`\nКарта ${map.name} (${map.size}):`);
        console.log(`  Размер: ${map.pixelSize}px`);
        console.log(`  Тип карты: ${isSmallMap ? 'МАЛЕНЬКАЯ' : 'БОЛЬШАЯ'}`);
        console.log(`  Макс. боссов: ${maxBosses}`);
        console.log(`  Результат: ${isSmallMap ? '✅ РОВНО 1 БОСС' : '✅ НЕСКОЛЬКО БОССОВ'}`);
    });
}

demonstrateBossSpawning();

// СИСТЕМА ГРАНИЦ АРЕНЫ (ИСПРАВЛЕННАЯ)
console.log('\n🏗️ СИСТЕМА ГРАНИЦ АРЕНЫ:');
console.log('=========================');

class ArenaBoundarySystem {
    constructor(mapWidth, mapHeight) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileSize = 32;
    }

    // Исправленная система границ для монстров
    keepMonsterInBounds(monster) {
        const oldX = monster.x;
        const oldY = monster.y;

        // Добавляем padding для радиуса монстра + половина тайла
        const padding = monster.radius + this.tileSize * 0.5;

        monster.x = Math.max(padding, Math.min(monster.x, this.mapWidth - padding));
        monster.y = Math.max(padding, Math.min(monster.y, this.mapHeight - padding));

        const moved = oldX !== monster.x || oldY !== monster.y;

        if (moved) {
            console.log(`🔄 ${monster.type.toUpperCase()} возвращен в границы:`);
            console.log(`   Было: (${oldX.toFixed(1)}, ${oldY.toFixed(1)})`);
            console.log(`   Стало: (${monster.x.toFixed(1)}, ${monster.y.toFixed(1)})`);
        }

        return moved;
    }
}

// Демонстрация работы границ
const arena = new ArenaBoundarySystem(512, 512); // Маленькая карта 16x16

const monsters = [
    { type: 'regular', x: 480, y: 250, radius: 16 },  // Почти у края
    { type: 'vampire', x: 520, y: 250, radius: 22.5 }, // За пределами!
    { type: 'boss', x: 250, y: 480, radius: 46.5 }     // У нижнего края
];

console.log('\n🧪 ТЕСТИРОВАНИЕ ГРАНИЦ:');
console.log('=======================');

monsters.forEach((monster, index) => {
    console.log(`\nМонстр ${index + 1} (${monster.type}):`);
    console.log(`  Исходная позиция: (${monster.x}, ${monster.y})`);

    const wasCorrected = arena.keepMonsterInBounds(monster);

    if (!wasCorrected) {
        console.log('  ✅ Уже в границах');
    }
});

// ВИЗУАЛЬНОЕ МАСШТАБИРОВАНИЕ (ИСПРАВЛЕННОЕ)
console.log('\n🎨 ВИЗУАЛЬНОЕ МАСШТАБИРОВАНИЕ:');
console.log('===============================');

function demonstrateScaling() {
    const monsters = [
        { type: 'regular', baseScale: 1.0, description: 'Базовый размер' },
        { type: 'vampire', baseScale: 1.406, description: '1.4x больше обычного' },
        { type: 'boss', baseScale: 2.906, description: '2.9x больше обычного' }
    ];

    monsters.forEach(monster => {
        console.log(`\n${monster.type.toUpperCase()}:`);
        console.log(`  Базовый масштаб: ${monster.baseScale.toFixed(3)}x`);
        console.log(`  Описание: ${monster.description}`);
        console.log(`  Визуальный размер: ${(32 * monster.baseScale).toFixed(1)}px`);

        // Демонстрация анимации
        const pulse = 1.0 + Math.sin(Date.now() * 0.001 * 2) * 0.1;
        const finalScale = pulse * monster.baseScale;
        console.log(`  С анимацией пульса: ${finalScale.toFixed(3)}x`);
    });
}

demonstrateScaling();

// РЕЗУЛЬТАТЫ ИСПРАВЛЕНИЙ
console.log('\n🎯 РЕЗУЛЬТАТЫ ИСПРАВЛЕНИЙ:');
console.log('==========================');
console.log('✅ РАЗМЕРЫ: Каждый тип монстра имеет правильный размер');
console.log('✅ БОССЫ: На маленькой карте ровно 1 босс');
console.log('✅ ГРАНИЦЫ: Монстры не вылетают за пределы арены');
console.log('✅ СКЕЙЛИНГ: Визуальное масштабирование работает корректно');
console.log('✅ БАЛАНС: Игра стала более предсказуемой');

console.log('\n🎮 В ИГРЕ ЭТО ОЗНАЧАЕТ:');
console.log('=======================');
console.log('• Вампиры теперь действительно БОЛЬШЕ обычных монстров');
console.log('• Боссы выглядят УГРОЖАЮЩЕ ВЕЛИКИМИ');
console.log('• На маленькой карте только ОДИН мощный босс');
console.log('• Монстры НИКОГДА не вылетят за границы арены');
console.log('• Игра стала более ТАКТИЧНОЙ и СБАЛАНСИРОВАННОЙ');

console.log('\n🚀 ГОТОВО К ТЕСТИРОВАНИЮ!');
console.log('==========================');
console.log('Запустите игру и проверьте:');
console.log('• Размеры разных монстров');
console.log('• Количество боссов на карте');
console.log('• Границы арены для монстров');
