import { Container, Graphics, Point } from 'pixi.js';
import { Constants, Maps, Tiled } from '@tosios/common';

/**
 * Продвинутый менеджер освещения с учетом геометрии карты
 * Создает реалистичные тени и направленное освещение
 */
export class LightingManager {
    private container: Container;
    private darknessLayer: Graphics;
    private lightMask: Graphics;
    private shadowMask: Graphics;
    private ambientLightLayer: Graphics;

    // Данные карты для расчетов теней
    private mapData: any = null;
    private tileSize: number = 16;
    private wallsLayer: any = null;

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

        // Создаем слой для теней от стен
        this.shadowMask = new Graphics();

        // Добавляем слои в контейнер
        this.container.addChild(this.shadowMask);
        this.container.addChild(this.darknessLayer);

        // Применяем маску к слою темноты
        this.darknessLayer.mask = this.lightMask;

        console.log('🏮 LightingManager: Инициализация завершена');
    }

    /**
     * Загружает данные карты для расчетов теней
     */
    public loadMapData(mapData: any) {
        this.mapData = mapData;
        console.log('🏮 LightingManager: Данные карты загружены');

        // Находим слой стен для расчетов теней
        if (this.mapData?.layers) {
            this.wallsLayer = this.mapData.layers.find((layer: any) =>
                layer.name === 'walls' || layer.name === 'collisions'
            );

            if (this.wallsLayer) {
                console.log('🏮 LightingManager: Слой стен найден, размер:', this.wallsLayer.width, 'x', this.wallsLayer.height);
            } else {
                console.warn('🏮 LightingManager: Слой стен не найден!');
            }
        }
    }

    /**
     * Рассчитывает тени от стен
     */
    private calculateShadows(playerX: number, playerY: number) {
        if (!Constants.SHADOWS_ENABLED || !this.wallsLayer || !this.wallsLayer.data) return;

        this.shadowMask.clear();
        this.shadowMask.beginFill(0x000000, Constants.SHADOW_OPACITY); // Настраиваемая непрозрачность теней

        const mapWidth = this.wallsLayer.width;
        const mapHeight = this.wallsLayer.height;

        // Проходим по всем тайлам и создаем тени для стен
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tileIndex = y * mapWidth + x;
                const tileId = this.wallsLayer.data[tileIndex];

                // Если это стена (tileId > 0)
                if (tileId > 0) {
                    const worldX = x * this.tileSize;
                    const worldY = y * this.tileSize;

                    // Рассчитываем расстояние до игрока
                    const distance = Math.sqrt(
                        Math.pow(worldX - playerX, 2) + Math.pow(worldY - playerY, 2)
                    );

                    // Создаем тень только если стена достаточно близко к игроку
                    if (distance <= this.playerLightRadius + Constants.SHADOW_FADE_DISTANCE) {
                        this.createWallShadow(worldX, worldY, playerX, playerY);
                    }
                }
            }
        }

        this.shadowMask.endFill();
    }

    /**
     * Создает тень от конкретной стены
     */
    private createWallShadow(wallX: number, wallY: number, playerX: number, playerY: number) {
        const shadowLength = Constants.SHADOW_LENGTH; // Настраиваемая длина тени
        const wallSize = this.tileSize;

        // Рассчитываем направление от игрока к стене
        const angle = Math.atan2(wallY - playerY, wallX - playerX);

        // Создаем тень как вытянутый прямоугольник
        const shadowX = wallX + Math.cos(angle) * shadowLength / 2;
        const shadowY = wallY + Math.sin(angle) * shadowLength / 2;

        // Рисуем тень
        this.shadowMask.drawRect(
            shadowX - wallSize / 2,
            shadowY - wallSize / 2,
            wallSize,
            shadowLength
        );
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

        // Рассчитываем тени от стен
        this.calculateShadows(playerX, playerY);

        // Позиционируем слой темноты так, чтобы он следовал за камерой
        this.darknessLayer.x = -playerX + screenWidth / 2;
        this.darknessLayer.y = -playerY + screenHeight / 2;
        this.shadowMask.x = this.darknessLayer.x;
        this.shadowMask.y = this.darknessLayer.y;

        console.log(`🌑 Lighting updated: Player [${playerX.toFixed(0)}, ${playerY.toFixed(0)}], Shadows calculated`);
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
