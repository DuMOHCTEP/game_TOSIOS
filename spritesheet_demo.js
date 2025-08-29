// ДЕМОНСТРАЦИЯ СПРАЙТ-ЛИСТОВ ЛУЧНИКА
// Как работают 6+4+8 кадров анимации

console.log('🎨 СПРАЙТ-ЛИСТЫ ЛУЧНИКА В TOSIOS');
console.log('================================');

// АНАЛИЗ СПРАЙТ-ЛИСТОВ

console.log('\n🏹 СПРАЙТ-ЛИСТЫ ЛУЧНИКА:');
console.log('========================');

const spriteSheets = {
    idle: {
        file: 'Archer_Idle.png',
        frames: 6,
        frameWidth: 32,
        frameHeight: 32,
        description: 'Анимация ожидания',
        framesData: [
            'frame_0: Стойка, руки опущены',
            'frame_1: Легкое движение рук',
            'frame_2: Смена позы',
            'frame_3: Другая поза',
            'frame_4: Возврат к началу',
            'frame_5: Завершение цикла'
        ]
    },
    run: {
        file: 'Archer_Run.png',
        frames: 4,
        frameWidth: 32,
        frameHeight: 32,
        description: 'Анимация бега',
        framesData: [
            'frame_0: Левая нога впереди',
            'frame_1: Правая нога впереди',
            'frame_2: Левая нога в воздухе',
            'frame_3: Правая нога в воздухе'
        ]
    },
    shoot: {
        file: 'Archer_Shoot.png',
        frames: 8,
        frameWidth: 32,
        frameHeight: 32,
        description: 'Анимация выстрела',
        framesData: [
            'frame_0: Прицеливание',
            'frame_1: Натягивание тетивы',
            'frame_2: Максимальное натяжение',
            'frame_3: Выпуск стрелы',
            'frame_4: Отдача лука',
            'frame_5: Возврат в исходное положение',
            'frame_6: Завершение движения',
            'frame_7: Возврат к стойке'
        ]
    }
};

// ВЫВОД ИНФОРМАЦИИ О СПРАЙТ-ЛИСТАХ

Object.entries(spriteSheets).forEach(([key, sheet]) => {
    console.log(`\n🎯 ${sheet.file} (${sheet.frames} кадров):`);
    console.log(`   Размер: ${sheet.frameWidth}x${sheet.frameHeight} пикселей`);
    console.log(`   Описание: ${sheet.description}`);
    console.log('   Кадры:');
    sheet.framesData.forEach((frame, index) => {
        console.log(`     ${index}: ${frame}`);
    });
});

// РАСЧЕТ КООРДИНАТ КАДРОВ

console.log('\n📐 РАСЧЕТ КООРДИНАТ КАДРОВ:');
console.log('==========================');

function calculateFrameCoordinates(sheet) {
    console.log(`\nДля ${sheet.file}:`);
    for (let i = 0; i < sheet.frames; i++) {
        const x = i * sheet.frameWidth;
        const y = 0; // Предполагаем горизонтальное расположение
        console.log(`   Кадр ${i}: x=${x}, y=${y}, width=${sheet.frameWidth}, height=${sheet.frameHeight}`);
    }
}

Object.values(spriteSheets).forEach(calculateFrameCoordinates);

// ПСЕВДОКОД РЕАЛИЗАЦИИ

console.log('\n💻 ПСЕВДОКОД РЕАЛИЗАЦИИ:');
console.log('========================');

// Функция загрузки спрайт-листа
console.log(`
// 1. ЗАГРУЗКА СПРАЙТ-ЛИСТА
function loadSpriteSheet(imagePath, frameCount, frameWidth, frameHeight) {
    return new Promise((resolve) => {
        const baseTexture = PIXI.BaseTexture.from(imagePath);

        baseTexture.on('loaded', () => {
            const frames = [];

            for (let i = 0; i < frameCount; i++) {
                const rect = new PIXI.Rectangle(
                    i * frameWidth,    // x координата кадра
                    0,                 // y координата (все кадры в одном ряду)
                    frameWidth,        // ширина кадра
                    frameHeight        // высота кадра
                );

                const texture = new PIXI.Texture(baseTexture, rect);
                frames.push(texture);
            }

            resolve(frames);
        });
    });
}
`);

// Использование
console.log(`
// 2. ИСПОЛЬЗОВАНИЕ
async function setupArcherAnimations() {
    // Загружаем все анимации
    const [idleFrames, runFrames, shootFrames] = await Promise.all([
        loadSpriteSheet('Archer_Idle.png', 6, 32, 32),
        loadSpriteSheet('Archer_Run.png', 4, 32, 32),
        loadSpriteSheet('Archer_Shoot.png', 8, 32, 32)
    ]);

    // Создаем анимированные спрайты
    const idleSprite = new PIXI.AnimatedSprite(idleFrames);
    const runSprite = new PIXI.AnimatedSprite(runFrames);
    const shootSprite = new PIXI.AnimatedSprite(shootFrames);

    // Настраиваем анимации
    idleSprite.animationSpeed = 0.1;   // Медленная анимация ожидания
    runSprite.animationSpeed = 0.15;   // Быстрая анимация бега
    shootSprite.animationSpeed = 0.2;  // Очень быстрая анимация стрельбы

    // Запускаем анимации
    idleSprite.play();
    runSprite.play();

    // Для стрельбы - проигрываем один раз
    shootSprite.loop = false;
    shootSprite.onComplete = () => {
        // Возвращаемся к idle анимации
        switchToIdleAnimation();
    };

    return { idleSprite, runSprite, shootSprite };
}
`);

// Логика переключения анимаций
console.log(`
// 3. ЛОГИКА ПЕРЕКЛЮЧЕНИЯ АНИМАЦИЙ
function updateArcherAnimation(playerState) {
    const { isMoving, isShooting } = playerState;

    if (isShooting) {
        // Проигрываем анимацию стрельбы
        switchToShootAnimation();
    } else if (isMoving) {
        // Проигрываем анимацию бега
        switchToRunAnimation();
    } else {
        // Проигрываем анимацию ожидания
        switchToIdleAnimation();
    }
}
`);

// ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ

console.log('\n🎮 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:');
console.log('========================');

const examples = [
    {
        situation: 'Игрок стоит на месте',
        animation: 'idle',
        frames: '6 кадров',
        speed: '0.1 (медленно)'
    },
    {
        situation: 'Игрок бежит',
        animation: 'run',
        frames: '4 кадра',
        speed: '0.15 (средне)'
    },
    {
        situation: 'Игрок стреляет',
        animation: 'shoot',
        frames: '8 кадров',
        speed: '0.2 (быстро, один раз)'
    },
    {
        situation: 'Игрок только что выстрелил',
        animation: 'idle',
        frames: '6 кадров',
        speed: '0.1 (возврат к ожиданию)'
    }
];

examples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.situation}:`);
    console.log(`   Анимация: ${example.animation}`);
    console.log(`   Кадры: ${example.frames}`);
    console.log(`   Скорость: ${example.speed}`);
});

// СРАВНЕНИЕ С ВОИНОМ

console.log('\n⚔️ СРАВНЕНИЕ С ВОИНОМ:');
console.log('=====================');

const comparison = {
    'Воин': {
        textures: '4 отдельных файла (player-idle-1.png, player-idle-2.png, etc.)',
        animation: 'Автоматическая анимация через PIXI.AnimatedSprite',
        states: 'Только idle и dead',
        workflow: 'Простой, готовые файлы'
    },
    'Лучник': {
        textures: '3 спрайт-листа с 6+4+8 кадрами',
        animation: 'Ручная загрузка кадров из спрайт-листов',
        states: 'idle, run, shoot с переключением',
        workflow: 'Сложный, но более гибкий'
    }
};

Object.entries(comparison).forEach(([character, data]) => {
    console.log(`\n${character}:`);
    Object.entries(data).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
    });
});

// ПРЕИМУЩЕСТВА СПРАЙТ-ЛИСТОВ

console.log('\n✅ ПРЕИМУЩЕСТВА СПРАЙТ-ЛИСТОВ:');
console.log('==============================');

const advantages = [
    'Меньше HTTP запросов (3 вместо 18 файлов)',
    'Быстрее загружается',
    'Легче управлять последовательностями анимаций',
    'Профессиональный подход к спрайтам',
    'Возможность сложных анимаций (бега, стрельбы)',
    'Оптимизация производительности'
];

advantages.forEach((advantage, index) => {
    console.log(`${index + 1}. ${advantage}`);
});

console.log('\n🎯 ВЫВОД:');
console.log('=========');
console.log('В ваших спрайт-листах содержится богатая анимационная информация!');
console.log('Реализация позволит Лучнику иметь плавные и реалистичные движения.');
console.log('Это значительно улучшит визуальное восприятие персонажа!');

console.log('\n🏹 ГОТОВ К РЕАЛИЗАЦИИ!');
console.log('======================');
console.log('Теперь Лучник будет иметь профессиональную анимацию!');
console.log('6 кадров ожидания + 4 кадра бега + 8 кадров стрельбы = WOW! ✨');
