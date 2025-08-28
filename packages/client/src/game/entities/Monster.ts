import { BaseEntity } from './';
import { Effects } from '../sprites';
import { Graphics } from 'pixi.js';
import { Models } from '@tosios/common';
import { MonstersTextures } from '../assets/images';

const HURT_COLOR = 0xff0000;
const ZINDEXES = {
    SHADOW: 0,
    MONSTER: 1,
};

export type MonsterDirection = 'left' | 'right';

export class Monster extends BaseEntity {
    private _toX: number = 0;

    private _toY: number = 0;

    private _direction: MonsterDirection = 'right';

    private _shadow: Graphics;

    private _monsterType: string = 'bat';

    private _knockbackX: number = 0;

    private _knockbackY: number = 0;

    private _isDashing: boolean = false;

    private _cooldownUntil: number = 0;

    private _attackPositionX: number = 0;

    private _attackPositionY: number = 0;

    // Init
    constructor(monster: Models.MonsterJSON) {
        super({
            x: monster.x,
            y: monster.y,
            radius: monster.radius,
            textures: MonstersTextures.Monster,
            zIndex: ZINDEXES.MONSTER,
        });

        this._monsterType = monster.monsterType;
        this._knockbackX = monster.knockbackX;
        this._knockbackY = monster.knockbackY;
        this._isDashing = monster.isDashing;
        this._cooldownUntil = monster.cooldownUntil;
        this._attackPositionX = monster.attackPositionX;
        this._attackPositionY = monster.attackPositionY;

        // Apply color tint based on monster type
        this.applyMonsterTint();

        // Shadow
        this._shadow = new Graphics();
        this._shadow.zIndex = ZINDEXES.SHADOW;
        this._shadow.pivot.set(0.5);
        this._shadow.beginFill(0x000000, 0.3);
        this._shadow.drawEllipse(monster.radius, monster.radius * 2, monster.radius / 2, monster.radius / 4);
        this._shadow.endFill();
        this.container.addChild(this._shadow);

        // Sort rendering order
        this.container.sortChildren();
    }

    // Methods
    hurt() {
        Effects.flash(this.sprite, HURT_COLOR, 0xffffff);
    }

    updateFromServer(monster: Models.MonsterJSON) {
        // Update position and rotation
        this.x = monster.x;
        this.y = monster.y;
        this.rotation = monster.rotation;

        // Update monster-specific properties
        const typeChanged = this._monsterType !== monster.monsterType;
        this._monsterType = monster.monsterType;
        this._knockbackX = monster.knockbackX;
        this._knockbackY = monster.knockbackY;
        this._isDashing = monster.isDashing;
        this._cooldownUntil = monster.cooldownUntil;
        this._attackPositionX = monster.attackPositionX;
        this._attackPositionY = monster.attackPositionY;

        // Reapply base tint if monster type changed
        if (typeChanged) {
            this.applyMonsterTint();
        }

        // Apply visual effects based on state
        this.updateVisualEffects();
    }

    private applyMonsterTint() {
        // Apply base color tint based on monster type
        switch (this._monsterType) {
            case 'bat':
                this.sprite.tint = 0xcccccc; // Light gray for basic bat
                break;
            case 'aggressive':
                this.sprite.tint = 0xff4444; // Red for aggressive monster
                break;
            case 'fast':
                this.sprite.tint = 0x4444ff; // Blue for fast monster
                break;
            default:
                this.sprite.tint = 0xcccccc; // Default light gray
                break;
        }
    }

    private updateVisualEffects() {
        // Get base tint for monster type
        let baseTint = this.getBaseTintForType();

        // Add knockback visual effect
        if (Math.abs(this._knockbackX) > 0.1 || Math.abs(this._knockbackY) > 0.1) {
            // Make the tint brighter/different during knockback
            baseTint = this.adjustTintForKnockback(baseTint);
        }

        // Add cooldown visual effect
        if (Date.now() < this._cooldownUntil) {
            // Make the tint darker during cooldown to show "recovery" state
            baseTint = this.adjustTintForCooldown(baseTint);
        }

        this.sprite.tint = baseTint;

        // Add dash visual effect
        if (this._isDashing) {
            this.sprite.alpha = 0.7; // Semi-transparent during dash
        } else {
            this.sprite.alpha = 1.0; // Normal opacity
        }
    }

    private getBaseTintForType(): number {
        switch (this._monsterType) {
            case 'bat':
                return 0xcccccc; // Light gray
            case 'aggressive':
                return 0xff4444; // Red
            case 'fast':
                return 0x4444ff; // Blue
            default:
                return 0xcccccc;
        }
    }

    private adjustTintForKnockback(baseTint: number): number {
        // Make the tint brighter during knockback by increasing RGB values
        const r = Math.min(255, ((baseTint >> 16) & 0xff) + 64);
        const g = Math.min(255, ((baseTint >> 8) & 0xff) + 64);
        const b = Math.min(255, (baseTint & 0xff) + 64);
        return (r << 16) | (g << 8) | b;
    }

    private adjustTintForCooldown(baseTint: number): number {
        // Make the tint darker during cooldown by reducing RGB values
        const r = Math.max(0, ((baseTint >> 16) & 0xff) - 64);
        const g = Math.max(0, ((baseTint >> 8) & 0xff) - 64);
        const b = Math.max(0, (baseTint & 0xff) - 64);
        return (r << 16) | (g << 8) | b;
    }

    // Setters
    set x(x: number) {
        this.container.x = x;
        this.body.x = x;
    }

    set y(y: number) {
        this.container.y = y;
        this.body.y = y;
    }

    set toX(toX: number) {
        this._toX = toX;
    }

    set toY(toY: number) {
        this._toY = toY;
    }

    set rotation(rotation: number) {
        this._direction = getDirection(rotation);
        switch (this._direction) {
            case 'left':
                this.sprite.scale.x = -2;
                break;
            case 'right':
                this.sprite.scale.x = 2;
                break;
            default:
                break;
        }
    }

    // Getters
    get x(): number {
        return this.body.x;
    }

    get y(): number {
        return this.body.y;
    }

    get toX() {
        return this._toX;
    }

    get toY() {
        return this._toY;
    }

    get monsterType(): string {
        return this._monsterType;
    }

    get knockbackX(): number {
        return this._knockbackX;
    }

    get knockbackY(): number {
        return this._knockbackY;
    }

    get isDashing(): boolean {
        return this._isDashing;
    }

    get cooldownUntil(): number {
        return this._cooldownUntil;
    }

    get attackPositionX(): number {
        return this._attackPositionX;
    }

    get attackPositionY(): number {
        return this._attackPositionY;
    }
}

/**
 * Get a direction given a rotation.
 */
function getDirection(rotation: number): MonsterDirection {
    if (rotation >= -(Math.PI / 2) && rotation <= Math.PI / 2) {
        return 'right';
    }

    return 'left';
}
