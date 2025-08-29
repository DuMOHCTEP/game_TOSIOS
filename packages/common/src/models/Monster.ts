import { MonsterType, BossAbilityType } from '../constants';

export interface MonsterJSON {
    x: number;
    y: number;
    radius: number;
    rotation: number;
    monsterType: MonsterType;
    knockbackX: number;
    knockbackY: number;
    isDashing: boolean;
    cooldownUntil: number;
    attackPositionX: number;
    attackPositionY: number;
    // Target tracking for indicators
    targetPlayerId: string | null;
    // Animation flags
    cantAttack: boolean;
    // Boss-specific fields
    isBoss: boolean;
    bossHP: number;
    bossMaxHP: number;
    lastAbilityUsed: number;
    abilityCooldown: number;
}

export interface BossAbilityJSON {
    type: BossAbilityType;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    damage: number;
    speed: number;
}
