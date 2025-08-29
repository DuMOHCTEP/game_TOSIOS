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

        // Создаем слой окружающей темноты
        this.darknessLayer.beginFill(0x000000, this.darknessAlpha);
        this.darknessLayer.drawRect(0, 0, 2000, 2000); // Большая область
        this.darknessLayer.endFill();

        // Создаем слой окружающего света (амбиент)
        this.ambientLightLayer.beginFill(0x000000, 1 - this.ambientLightLevel);
        this.ambientLightLayer.drawRect(0, 0, 2000, 2000);
        this.ambientLightLayer.endFill();

        // Добавляем слои в контейнер
        this.container.addChild(this.ambientLightLayer);
        this.container.addChild(this.darknessLayer);
        this.container.addChild(this.lightMask);

        // Настраиваем маски
        this.darknessLayer.mask = this.lightMask;
        this.ambientLightLayer.mask = this.lightMask;
    }

    /**
     * Обновляет освещение вокруг игрока
     */
    public updatePlayerLight(playerX: number, playerY: number, screenWidth: number, screenHeight: number) {
        // Очищаем предыдущую маску света
        this.lightMask.clear();

        // Создаем круг света вокруг игрока
        this.lightMask.beginFill(0xffffff, this.lightIntensity);
        this.lightMask.drawCircle(playerX, playerY, this.playerLightRadius);
        this.lightMask.endFill();

        // Добавляем яркий центр
        this.lightMask.beginFill(0xffffff, 1.0);
        this.lightMask.drawCircle(playerX, playerY, this.playerLightRadius * 0.3);
        this.lightMask.endFill();

        // Позиционируем слои темноты относительно игрока
        this.darknessLayer.x = -playerX + screenWidth / 2;
        this.darknessLayer.y = -playerY + screenHeight / 2;
        this.ambientLightLayer.x = this.darknessLayer.x;
        this.ambientLightLayer.y = this.darknessLayer.y;
    }

    /**
     * Добавляет свет от монстра
     */
    public addMonsterLight(monsterX: number, monsterY: number, distanceToPlayer: number) {
        if (!Constants.MONSTER_GLOW_ENABLED) return;

        const monsterLightRadius = Constants.MONSTER_LIGHT_RADIUS;
        const lightIntensity = Math.max(0.2, 1.0 - (distanceToPlayer / (this.playerLightRadius + monsterLightRadius)));

        this.lightMask.beginFill(Constants.MONSTER_GLOW_COLOR, lightIntensity * 0.6); // Monster glow
        this.lightMask.drawCircle(monsterX, monsterY, monsterLightRadius * 0.6);
        this.lightMask.endFill();
    }

    /**
     * Добавляет вспышку света (например, от выстрела)
     */
    public addFlashLight(x: number, y: number, radius?: number, duration?: number) {
        if (!Constants.BULLET_FLASH_ENABLED) return;

        const flashRadius = radius || Constants.BULLET_FLASH_RADIUS;
        const flashDuration = duration || Constants.BULLET_FLASH_DURATION;

        const flash = new Graphics();
        flash.beginFill(0xffffff, 0.9); // Bright white flash
        flash.drawCircle(x, y, flashRadius);
        flash.endFill();

        // Add inner bright core
        flash.beginFill(0xffffff, 1.0);
        flash.drawCircle(x, y, flashRadius * 0.3);
        flash.endFill();

        this.container.addChild(flash);

        // Remove flash after duration
        setTimeout(() => {
            if (flash.parent) {
                flash.parent.removeChild(flash);
            }
        }, flashDuration);
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
