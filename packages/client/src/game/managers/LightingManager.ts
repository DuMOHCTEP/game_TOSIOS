import { Container, Graphics } from 'pixi.js';
import { Constants } from '@tosios/common';

/**
 * Менеджер освещения для создания атмосферы подземелья
 * Управляет зоной видимости, эффектами света и темными областями
 */
export class LightingManager {
    private container: Container;
    private darknessLayer: Graphics;
    private lightMask: Graphics;
    private ambientLightLayer: Graphics;

    // Настройки освещения
    private playerLightRadius: number;
    private darknessAlpha: number;
    private lightIntensity: number;
    private ambientLightLevel: number;

    constructor() {
        this.container = new Container();
        this.darknessLayer = new Graphics();
        this.lightMask = new Graphics();
        this.ambientLightLayer = new Graphics();

        // Загружаем настройки из констант
        this.playerLightRadius = Constants.PLAYER_LIGHT_RADIUS;
        this.darknessAlpha = Constants.DARKNESS_ALPHA;
        this.lightIntensity = Constants.LIGHT_INTENSITY;
        this.ambientLightLevel = Constants.AMBIENT_LIGHT_LEVEL;

        this.initLighting();
    }

    private initLighting() {
        console.log('🏮 LightingManager: Инициализация системы освещения подземелья');
        console.log('Параметры освещения:', {
            darknessAlpha: this.darknessAlpha,
            lightIntensity: this.lightIntensity,
            playerLightRadius: this.playerLightRadius,
            ambientLightLevel: this.ambientLightLevel
        });

        // Создаем полноэкранный слой темноты
        this.darknessLayer.beginFill(0x000000, this.darknessAlpha);
        this.darknessLayer.drawRect(-5000, -5000, 10000, 10000); // Очень большая область
        this.darknessLayer.endFill();

        // Создаем маску света (изначально пустая - всё темно)
        this.lightMask.beginFill(0x000000, 1.0); // Начинаем с полной темноты
        this.lightMask.drawRect(-5000, -5000, 10000, 10000);
        this.lightMask.endFill();

        // Добавляем слои в контейнер
        this.container.addChild(this.darknessLayer);

        // Применяем маску к слою темноты
        this.darknessLayer.mask = this.lightMask;

        console.log('🏮 LightingManager: Инициализация завершена');
    }

    /**
     * Обновляет освещение вокруг игрока
     */
    public updatePlayerLight(playerX: number, playerY: number, screenWidth: number, screenHeight: number) {
        console.log(`💡 LightingManager: Обновление света игрока [${playerX.toFixed(0)}, ${playerY.toFixed(0)}], радиус: ${this.playerLightRadius}`);

        // Очищаем предыдущую маску света
        this.lightMask.clear();

        // Сначала создаем полностью темную маску (ничего не видно)
        this.lightMask.beginFill(0x000000, 1.0);
        this.lightMask.drawRect(-5000, -5000, 10000, 10000);
        this.lightMask.endFill();

        // Затем вырезаем области света (делаем их прозрачными в маске)
        this.lightMask.beginFill(0xffffff, 1.0);
        this.lightMask.drawCircle(playerX, playerY, this.playerLightRadius);
        this.lightMask.endFill();

        // Добавляем яркий центр (более яркий свет)
        this.lightMask.beginFill(0xffffff, 1.0);
        this.lightMask.drawCircle(playerX, playerY, this.playerLightRadius * 0.3);
        this.lightMask.endFill();

        // Позиционируем слой темноты так, чтобы он следовал за камерой
        this.darknessLayer.x = -playerX + screenWidth / 2;
        this.darknessLayer.y = -playerY + screenHeight / 2;

        console.log(`🌑 Darkness layer position: [${this.darknessLayer.x.toFixed(0)}, ${this.darknessLayer.y.toFixed(0)}]`);
    }

    /**
     * Добавляет свет от монстра
     */
    public addMonsterLight(monsterX: number, monsterY: number, distanceToPlayer: number) {
        if (!Constants.MONSTER_GLOW_ENABLED) return;

        const monsterLightRadius = Constants.MONSTER_LIGHT_RADIUS;

        // Вырезаем область света от монстра в маске
        this.lightMask.beginFill(0xffffff, 0.6); // Monster light area
        this.lightMask.drawCircle(monsterX, monsterY, monsterLightRadius);
        this.lightMask.endFill();
    }

    /**
     * Добавляет вспышку света (например, от выстрела)
     */
    public addFlashLight(x: number, y: number, radius?: number, duration?: number) {
        if (!Constants.BULLET_FLASH_ENABLED) return;

        const flashRadius = radius || Constants.BULLET_FLASH_RADIUS;
        const flashDuration = duration || Constants.BULLET_FLASH_DURATION;

        // Добавляем временную область света в маске
        this.lightMask.beginFill(0xffffff, 1.0);
        this.lightMask.drawCircle(x, y, flashRadius);
        this.lightMask.endFill();

        // Добавляем яркий центр
        this.lightMask.beginFill(0xffffff, 1.0);
        this.lightMask.drawCircle(x, y, flashRadius * 0.3);
        this.lightMask.endFill();

        // Удаляем вспышку через время (перерисовываем маску без вспышки)
        setTimeout(() => {
            this.refreshLightMask();
        }, flashDuration);
    }

    private refreshLightMask() {
        // Этот метод будет вызываться для обновления маски после вспышек
        // Пока оставляем пустым, так как маска обновляется каждый кадр в updatePlayerLight
    }

    /**
     * Изменяет настройки освещения
     */
    public updateSettings(settings: {
        playerLightRadius?: number;
        darknessAlpha?: number;
        lightIntensity?: number;
        ambientLightLevel?: number;
    }) {
        if (settings.playerLightRadius !== undefined) {
            this.playerLightRadius = settings.playerLightRadius;
        }
        if (settings.darknessAlpha !== undefined) {
            this.darknessAlpha = settings.darknessAlpha;
            this.updateDarknessLayer();
        }
        if (settings.lightIntensity !== undefined) {
            this.lightIntensity = settings.lightIntensity;
        }
        if (settings.ambientLightLevel !== undefined) {
            this.ambientLightLevel = settings.ambientLightLevel;
            this.updateAmbientLayer();
        }
    }

    private updateDarknessLayer() {
        this.darknessLayer.clear();
        this.darknessLayer.beginFill(0x000000, this.darknessAlpha);
        this.darknessLayer.drawRect(0, 0, 2000, 2000);
        this.darknessLayer.endFill();
    }

    private updateAmbientLayer() {
        this.ambientLightLayer.clear();
        this.ambientLightLayer.beginFill(0x000000, 1 - this.ambientLightLevel);
        this.ambientLightLayer.drawRect(0, 0, 2000, 2000);
        this.ambientLightLayer.endFill();
    }

    /**
     * Возвращает контейнер освещения для добавления в сцену
     */
    public getContainer(): Container {
        return this.container;
    }

    /**
     * Включает/выключает систему освещения
     */
    public setEnabled(enabled: boolean) {
        this.container.visible = enabled;
    }

    /**
     * Очищает всю систему освещения
     */
    public destroy() {
        this.container.destroy();
    }
}
