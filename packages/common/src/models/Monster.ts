import { MonsterType } from '../constants';

export interface MonsterJSON {
    x: number;
    y: number;
    radius: number;
    rotation: number;
    monsterType: MonsterType;
    knockbackX: number;
    knockbackY: number;
    isDashing: boolean;
}
