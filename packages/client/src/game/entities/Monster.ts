import { BaseEntity } from './';
import { Effects } from '../sprites';
import { Graphics } from 'pixi.js';
import { Models, Constants } from '@tosios/common';
import { MonstersTextures } from '../assets/images';
import { Vampire } from '../assets/images/monsters';

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

    // Target tracking
    private _targetPlayerId: string | null = null;
    private _currentPlayerId: string | null = null;

    // Boss-specific properties
    private _isBoss: boolean = false;
    private _bossHP: number = 0;
    private _bossMaxHP: number = 0;

    // Boss visual effects
    private _bossGlow: Graphics;
    private _healthBar: Graphics;

    // Target indicator
    private _targetIndicator: Graphics;

    // Init
    constructor(monster: Models.MonsterJSON) {
        // Choose appropriate texture based on monster type
        const textures = monster.monsterType === 'vampire' ? Vampire : MonstersTextures.Monster;

        super({
            x: monster.x,
            y: monster.y,
            radius: monster.radius,
            textures: textures,
            zIndex: ZINDEXES.MONSTER,
        });

        this._monsterType = monster.monsterType;
        this._knockbackX = monster.knockbackX;
        this._knockbackY = monster.knockbackY;
        this._isDashing = monster.isDashing;
        this._cooldownUntil = monster.cooldownUntil;
        this._attackPositionX = monster.attackPositionX;
        this._attackPositionY = monster.attackPositionY;

        // Boss-specific properties
        this._isBoss = monster.isBoss;
        this._bossHP = monster.bossHP;
        this._bossMaxHP = monster.bossMaxHP;

        // Apply color tint based on monster type
        this.applyMonsterTint();

        // Create boss visual effects if this is a boss
        if (this._isBoss) {
            this.createBossVisualEffects();
            console.log('Boss visual effects created for monster, HP:', this._bossHP, '/', this._bossMaxHP);
            // Force initial update of visual effects
            this.updateBossVisualEffects();
        }

        // Shadow
        this._shadow = new Graphics();
        this._shadow.zIndex = ZINDEXES.SHADOW;
        this._shadow.pivot.set(0.5);
        this._shadow.beginFill(0x000000, 0.3);
        this._shadow.drawEllipse(monster.radius, monster.radius * 2, monster.radius / 2, monster.radius / 4);
        this._shadow.endFill();
        this.container.addChild(this._shadow);

        // Create target indicator
        this._targetIndicator = new Graphics();
        this._targetIndicator.zIndex = ZINDEXES.MONSTER + 1; // Above monster
        this.container.addChild(this._targetIndicator);

        // Sort rendering order
        this.container.sortChildren();
    }

    // Methods
    hurt() {
        Effects.flash(this.sprite, HURT_COLOR, 0xffffff);
    }

    updateFromServer(monster: Models.MonsterJSON, currentPlayerId?: string) {
        // Update position and rotation
        this.x = monster.x;
        this.y = monster.y;
        this.rotation = monster.rotation;

        // Update monster-specific properties
        const typeChanged = this._monsterType !== monster.monsterType;
        const wasBoss = this._isBoss;
        this._monsterType = monster.monsterType;
        this._knockbackX = monster.knockbackX;
        this._knockbackY = monster.knockbackY;
        this._isDashing = monster.isDashing;
        this._cooldownUntil = monster.cooldownUntil;
        this._attackPositionX = monster.attackPositionX;
        this._attackPositionY = monster.attackPositionY;
        this._targetPlayerId = monster.targetPlayerId;
        this._currentPlayerId = currentPlayerId || null;

        // Update boss-specific properties
        this._isBoss = monster.isBoss;
        this._bossHP = monster.bossHP;
        this._bossMaxHP = monster.bossMaxHP;

        console.log(`🔄 SERVER UPDATE: isBoss=${monster.isBoss}, bossHP=${monster.bossHP}/${monster.bossMaxHP}, type=${monster.monsterType}`);
        console.log(`📊 CLIENT STATE: _isBoss=${this._isBoss}, _bossHP=${this._bossHP}/${this._bossMaxHP}, _monsterType=${this._monsterType}`);

        // Handle boss visual effects creation/destruction
        if (this._isBoss && !wasBoss) {
            console.log('🎯 BECOMING BOSS - creating visual effects!');
            this.createBossVisualEffects();
        } else if (!this._isBoss && wasBoss) {
            console.log('❌ STOPPING BOSS - destroying visual effects!');
            this.destroyBossVisualEffects();
        } else if (this._isBoss && wasBoss) {
            console.log('🔄 STAYING BOSS - updating effects!');
        }

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
            case 'boss':
                this.sprite.tint = 0x66ccff; // Bright blue for cold boss
                break;
            case 'vampire':
                this.sprite.tint = 0x8B008B; // Dark magenta (vampire purple)
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

        // Add AI behavior visual indicators
        baseTint = this.adjustTintForAIBehavior(baseTint);

        this.sprite.tint = baseTint;

        // Add dash visual effect
        if (this._isDashing) {
            this.sprite.alpha = 0.7; // Semi-transparent during dash
        } else if (Date.now() < this._cooldownUntil) {
            this.sprite.alpha = 0.8; // Slightly transparent during cooldown
        } else {
            this.sprite.alpha = 1.0; // Normal opacity
        }

        // Add scale effects for different behaviors
        this.updateScaleEffects();

        // Update target indicator
        this.updateTargetIndicator();

        // Update boss visual effects
        if (this._isBoss) {
            console.log(`🎯 UPDATING BOSS VISUALS - HP: ${this._bossHP}/${this._bossMaxHP}, Radius: ${this.radius}`);
            this.updateBossVisualEffects();
            // Debug: check if boss glow exists
            if (!this._bossGlow) {
                console.log('❌ Boss glow is null, recreating...');
                this.createBossVisualEffects();
            } else {
                console.log('✅ Boss glow exists, updating...');
            }
        }
    }

    private adjustTintForAIBehavior(baseTint: number): number {
        // Add subtle tint variations based on monster behavior
        const time = Date.now() * 0.001; // Convert to seconds

        switch (this._monsterType) {
            case 'aggressive':
                // Pulsing red tint when aggressive
                const aggressivePulse = Math.sin(time * 3) * 0.1 + 0.9;
                return this.multiplyTint(baseTint, aggressivePulse);
            case 'fast':
                // Blue tint with slight variation
                const fastVariation = Math.sin(time * 5) * 0.05 + 0.95;
                return this.multiplyTint(baseTint, fastVariation);
            default:
                return baseTint;
        }
    }

    private multiplyTint(baseTint: number, multiplier: number): number {
        const r = Math.min(255, Math.floor(((baseTint >> 16) & 0xff) * multiplier));
        const g = Math.min(255, Math.floor(((baseTint >> 8) & 0xff) * multiplier));
        const b = Math.min(255, Math.floor((baseTint & 0xff) * multiplier));
        return (r << 16) | (g << 8) | b;
    }

    private updateScaleEffects() {
        const time = Date.now() * 0.001;

        if (this._isBoss) {
            // Boss has majestic pulsing with configurable scale
            const bossPulse = 1.0 + Math.sin(time * 2) * 0.1;
            const bossWidth = Constants.MONSTER_BOSS_SCALE_WIDTH; // Configurable width scale
            const bossHeight = Constants.MONSTER_BOSS_SCALE_HEIGHT; // Configurable height scale
            this.sprite.scale.set(bossPulse * bossWidth, bossPulse * bossHeight);
        } else if (this._monsterType === 'fast' && Date.now() < this._cooldownUntil) {
            // Fast monsters have subtle scale pulsing during cooldown
            const scalePulse = 1.0 + Math.sin(time * 8) * 0.05;
            this.sprite.scale.set(scalePulse, scalePulse);
        } else if (this._monsterType === 'aggressive' && Math.abs(this._knockbackX) > 0.1) {
            // Aggressive monsters squash during knockback
            const squashScale = 0.9 + Math.sin(time * 10) * 0.1;
            this.sprite.scale.set(1.1, squashScale);
        } else if (this._monsterType === 'vampire') {
            // Vampire has larger size and subtle ethereal pulsing
            const etherealPulse = 1.0 + Math.sin(time * 1.5) * 0.05;
            const vampireScale = Constants.MONSTER_VAMPIRE_SIZE / Constants.MONSTER_SIZE; // Scale relative to regular monster
            this.sprite.scale.set(etherealPulse * vampireScale, etherealPulse * vampireScale);
        } else {
            // Normal scale
            this.sprite.scale.set(1.0, 1.0);
        }
    }

    private createBossVisualEffects() {
        console.log('🎨 Creating boss visual effects...');
        console.log(`👑 BOSS STATS: HP=${this._bossHP}/${this._bossMaxHP}, Radius=${this.radius}, Type=${this._monsterType}`);

        // Create glowing aura around boss
        this._bossGlow = new Graphics();
        this._bossGlow.zIndex = ZINDEXES.SHADOW - 1; // Behind everything else

        // Create health bar
        this._healthBar = new Graphics();
        this._healthBar.zIndex = ZINDEXES.BULLETS + 1; // Above bullets

        this.container.addChild(this._bossGlow);
        this.container.addChild(this._healthBar);

        console.log('✅ Boss visual effects created successfully');
        console.log(`🎨 Boss glow: ${this._bossGlow ? 'EXISTS' : 'NULL'}`);
        console.log(`❤️ Boss health bar: ${this._healthBar ? 'EXISTS' : 'NULL'}`);

        this.updateBossVisualEffects();
    }

    private updateBossVisualEffects() {
        if (!this._isBoss || !this._bossGlow || !this._healthBar) {
            console.log('Boss visual effects not ready:', { isBoss: this._isBoss, hasGlow: !!this._bossGlow, hasBar: !!this._healthBar });
            return;
        }

        const time = Date.now() * 0.001;
        const radius = this.radius;

        console.log(`⚡ Boss aura update: radius=${radius}, time=${time.toFixed(2)}, intensity=${glowIntensity}`);

        // Update epic boss aura
        this._bossGlow.clear();
        const glowIntensity = 0.6 + Math.sin(time * 1.5) * 0.2; // Very strong pulsing

        console.log(`🎨 Drawing boss aura with ${glowIntensity.toFixed(2)} intensity`);

        // Core energy sphere
        this._bossGlow.beginFill(0xffffff, glowIntensity * 0.8);
        this._bossGlow.drawCircle(0, 0, radius * 0.8);
        this._bossGlow.endFill();

        // Inner energy rings
        for (let ring = 0; ring < 3; ring++) {
            const ringRadius = radius * (1.0 + ring * 0.3);
            const ringAlpha = glowIntensity * (0.6 - ring * 0.15);
            const ringColor = ring === 0 ? 0x00ffff : ring === 1 ? 0x0088ff : 0x0044aa;

            this._bossGlow.lineStyle(2, ringColor, ringAlpha);
            this._bossGlow.drawCircle(0, 0, ringRadius);
            this._bossGlow.lineStyle(0); // Reset line style
        }

        // Outer energy waves
        for (let wave = 0; wave < 4; wave++) {
            const waveRadius = radius * (1.8 + Math.sin(time * 2 + wave) * 0.3);
            const waveAlpha = glowIntensity * 0.4 * (1 - wave * 0.2);

            this._bossGlow.beginFill(0x44aaff, waveAlpha);
            this._bossGlow.drawCircle(0, 0, waveRadius);
            this._bossGlow.endFill();
        }

        // Energy particles orbiting around boss
        for (let i = 0; i < 12; i++) {
            const angle = (time * 1.0 + i * Math.PI / 6) % (Math.PI * 2);
            const distance = radius * (1.5 + Math.sin(time * 2 + i) * 0.4);
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const particleSize = 4 + Math.sin(time * 3 + i) * 2;

            // Particle core
            this._bossGlow.beginFill(0xffffff, glowIntensity);
            this._bossGlow.drawCircle(x, y, particleSize * 0.3);
            this._bossGlow.endFill();

            // Particle aura
            this._bossGlow.beginFill(0x00ffff, glowIntensity * 0.6);
            this._bossGlow.drawCircle(x, y, particleSize);
            this._bossGlow.endFill();
        }

        // Lightning-like energy arcs
        for (let arc = 0; arc < 6; arc++) {
            const startAngle = (time * 0.8 + arc * Math.PI / 3) % (Math.PI * 2);
            const endAngle = startAngle + Math.PI / 6;
            const arcRadius = radius * 2.2;

            const startX = Math.cos(startAngle) * arcRadius;
            const startY = Math.sin(startAngle) * arcRadius;
            const endX = Math.cos(endAngle) * arcRadius;
            const endY = Math.sin(endAngle) * arcRadius;

            this._bossGlow.lineStyle(3, 0x00ffff, glowIntensity * 0.7);
            this._bossGlow.moveTo(startX, startY);
            this._bossGlow.lineTo(endX, endY);
        }

        // Shockwave effects
        if (Math.sin(time * 4) > 0.8) {
            this._bossGlow.lineStyle(4, 0xffffff, glowIntensity * 0.9);
            this._bossGlow.drawCircle(0, 0, radius * 2.5);
            this._bossGlow.lineStyle(0);
        }

        // Update health bar
        this._healthBar.clear();
        const barWidth = radius * 2;
        const barHeight = 6;
        const healthPercent = this._bossHP / this._bossMaxHP;

        // Background
        this._healthBar.beginFill(0x333333, 0.8);
        this._healthBar.drawRect(-barWidth/2, -radius - 15, barWidth, barHeight);
        this._healthBar.endFill();

        // Health fill
        const healthColor = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
        this._healthBar.beginFill(healthColor, 0.9);
        this._healthBar.drawRect(-barWidth/2, -radius - 15, barWidth * healthPercent, barHeight);
        this._healthBar.endFill();

        // Border
        this._healthBar.lineStyle(1, 0xffffff, 0.8);
        this._healthBar.drawRect(-barWidth/2, -radius - 15, barWidth, barHeight);
    }

    private destroyBossVisualEffects() {
        if (this._bossGlow) {
            this.container.removeChild(this._bossGlow);
            this._bossGlow.destroy();
            this._bossGlow = null;
        }

        if (this._healthBar) {
            this.container.removeChild(this._healthBar);
            this._healthBar.destroy();
            this._healthBar = null;
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
            case 'boss':
                return 0xffaa00; // Golden
            case 'vampire':
                return 0x8B008B; // Dark magenta (vampire purple)
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

    private updateTargetIndicator() {
        if (!this._targetIndicator) return;

        // Clear previous indicator
        this._targetIndicator.clear();

        // Check if this monster is targeting the current player
        const isTargetingMe = this._targetPlayerId === this._currentPlayerId;

        if (isTargetingMe) {
            const time = Date.now() * 0.001;
            const radius = this.radius;

            // Create pulsing red indicator above monster
            const pulseIntensity = 0.7 + Math.sin(time * 3) * 0.3;
            const indicatorRadius = radius * 0.8;

            // Outer glow ring
            this._targetIndicator.beginFill(0xff0000, pulseIntensity * 0.3);
            this._targetIndicator.drawCircle(0, -radius - 10, indicatorRadius * 1.5);
            this._targetIndicator.endFill();

            // Inner warning circle
            this._targetIndicator.beginFill(0xff0000, pulseIntensity * 0.7);
            this._targetIndicator.drawCircle(0, -radius - 10, indicatorRadius);
            this._targetIndicator.endFill();

            // White center dot
            this._targetIndicator.beginFill(0xffffff, pulseIntensity);
            this._targetIndicator.drawCircle(0, -radius - 10, indicatorRadius * 0.3);
            this._targetIndicator.endFill();

            // Add exclamation mark for extra warning
            this._targetIndicator.lineStyle(2, 0xffffff, pulseIntensity);
            this._targetIndicator.moveTo(0, -radius - 10 - indicatorRadius * 0.5);
            this._targetIndicator.lineTo(0, -radius - 10 + indicatorRadius * 0.5);
            this._targetIndicator.moveTo(0, -radius - 10 + indicatorRadius * 0.2);
            this._targetIndicator.lineTo(0, -radius - 10 + indicatorRadius * 0.5);

            console.log(`🎯 TARGET INDICATOR: Monster is targeting YOU!`);
        }
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

    // Boss-specific getters
    get isBoss(): boolean {
        return this._isBoss;
    }

    get bossHP(): number {
        return this._bossHP;
    }

    get bossMaxHP(): number {
        return this._bossMaxHP;
    }

    get bossHealthPercentage(): number {
        return this._isBoss ? (this._bossHP / this._bossMaxHP) * 100 : 100;
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
