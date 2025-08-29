import { Container, Graphics, Sprite, utils } from 'pixi.js';
import { Constants } from '@tosios/common';

export default class LightingManager {
    private container: Container;
    private isEnabled: boolean = false;
    private playerLight: Graphics;
    private monsterLights: { [key: string]: Graphics } = {};
    private flashLights: Graphics[] = [];

    constructor() {
        this.container = new Container();
        this.container.name = 'Lighting';

        // Create player light
        this.playerLight = new Graphics();
        this.playerLight.name = 'PlayerLight';
        this.container.addChild(this.playerLight);

        // Create darkness overlay
        const darkness = new Graphics();
        darkness.name = 'Darkness';
        darkness.beginFill(0x000000, Constants.DARKNESS_ALPHA);
        darkness.drawRect(0, 0, 1, 1); // Will be resized in updatePlayerLight
        darkness.endFill();
        this.container.addChild(darkness);
    }

    public setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.container.visible = enabled;
    }

    public getContainer(): Container {
        return this.container;
    }

    public updatePlayerLight(playerX: number, playerY: number, screenWidth: number, screenHeight: number): void {
        if (!this.isEnabled) return;

        // Clear previous light
        this.playerLight.clear();

        // Draw player light circle
        this.playerLight.beginFill(0xffffff, Constants.LIGHT_INTENSITY);
        this.playerLight.drawCircle(0, 0, Constants.PLAYER_LIGHT_RADIUS);
        this.playerLight.endFill();

        // Position light at player
        this.playerLight.x = playerX;
        this.playerLight.y = playerY;

        // Update darkness overlay to cover entire screen
        const darkness = this.container.getChildByName('Darkness') as Graphics;
        if (darkness) {
            darkness.clear();
            darkness.beginFill(0x000000, Constants.DARKNESS_ALPHA);
            darkness.drawRect(0, 0, screenWidth, screenHeight);
            darkness.endFill();
        }
    }

    public addMonsterLight(x: number, y: number, distanceToPlayer: number): void {
        if (!this.isEnabled) return;

        const monsterId = `monster_${x}_${y}`;

        // Remove existing light for this monster
        if (this.monsterLights[monsterId]) {
            this.container.removeChild(this.monsterLights[monsterId]);
            delete this.monsterLights[monsterId];
        }

        // Create new monster light
        const monsterLight = new Graphics();
        monsterLight.name = `MonsterLight_${monsterId}`;

        // Calculate light intensity based on distance (closer = brighter)
        const maxDistance = Constants.PLAYER_LIGHT_RADIUS;
        const intensity = Math.max(0.1, 1 - (distanceToPlayer / maxDistance));

        monsterLight.beginFill(0xffaa00, intensity * 0.5); // Orange color for monsters
        monsterLight.drawCircle(0, 0, Constants.MONSTER_LIGHT_RADIUS);
        monsterLight.endFill();

        monsterLight.x = x;
        monsterLight.y = y;

        this.monsterLights[monsterId] = monsterLight;
        this.container.addChild(monsterLight);
    }

    public addFlashLight(x: number, y: number): void {
        if (!this.isEnabled) return;

        const flashLight = new Graphics();
        flashLight.name = 'FlashLight';

        // Create flash effect
        flashLight.beginFill(0xffffff, 0.8);
        flashLight.drawCircle(0, 0, Constants.BULLET_FLASH_RADIUS);
        flashLight.endFill();

        flashLight.x = x;
        flashLight.y = y;

        this.flashLights.push(flashLight);
        this.container.addChild(flashLight);

        // Remove flash after duration
        setTimeout(() => {
            const index = this.flashLights.indexOf(flashLight);
            if (index > -1) {
                this.container.removeChild(flashLight);
                this.flashLights.splice(index, 1);
            }
        }, Constants.BULLET_FLASH_DURATION);
    }

    public clearMonsterLights(): void {
        Object.keys(this.monsterLights).forEach(key => {
            this.container.removeChild(this.monsterLights[key]);
            delete this.monsterLights[key];
        });
    }

    public destroy(): void {
        this.clearMonsterLights();
        this.flashLights.forEach(light => {
            this.container.removeChild(light);
        });
        this.flashLights = [];
        this.container.destroy();
    }
}
