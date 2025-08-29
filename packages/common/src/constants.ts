export const APP_TITLE = 'TOSIOS';

// General
export const WS_PORT = 3001;
export const ROOM_NAME = 'game'; // Colyseus Room<T>'s name (no need to change)
export const ROOM_REFRESH = 3000;
export const PLAYERS_REFRESH = 1000;
export const DEBUG = false;

// Game
export const MAPS_NAMES = ['small', 'gigantic'];
export const ROOM_PLAYERS_MIN = 2;
export const ROOM_PLAYERS_MAX = 16;
export const ROOM_PLAYERS_SCALES = [2, 4, 8, 16];
export const ROOM_NAME_MAX = 16;
export const PLAYER_NAME_MAX = 16;
export const LOG_LINES_MAX = 5;
export const LOBBY_DURATION = 1000 * 10; // 10 seconds
export const GAME_DURATION = 1000 * 90; // 90 seconds
export const GAME_MODES = ['deathmatch', 'team deathmatch'];

// Background
export const BACKGROUND_COLOR = '#25131A';

// Tile (rectangle)
export const TILE_SIZE = 32;

// Player (circle)
export const PLAYER_SIZE = 32;
export const PLAYER_SPEED = 1;
export const PLAYER_MAX_LIVES = 3;
export const PLAYER_WEAPON_SIZE = 12; // The bigger, the further away a bullet will be shot from.
export const PLAYER_HEARING_DISTANCE = 256;

// Monster Types
export const MONSTER_TYPES = ['bat', 'aggressive', 'fast', 'boss'] as const;
export type MonsterType = typeof MONSTER_TYPES[number];

// Monster
export const MONSTERS_COUNT = 3;
export const MONSTER_SIZE = 32;
export const MONSTER_SPEED_PATROL = 0.75;
export const MONSTER_SPEED_CHASE = 1.25;
export const MONSTER_SIGHT = 192;
export const MONSTER_LIVES = 3;
export const MONSTER_IDLE_DURATION_MIN = 1000;
export const MONSTER_IDLE_DURATION_MAX = 3000;
export const MONSTER_PATROL_DURATION_MIN = 1000;
export const MONSTER_PATROL_DURATION_MAX = 3000;
export const MONSTER_ATTACK_BACKOFF = 3000;

// Attack knockback settings
export const MONSTER_ATTACK_KNOCKBACK_DISTANCE = 150; // pixels
export const MONSTER_ATTACK_KNOCKBACK_FORCE = 10.0; // stronger force to reach 150px
export const MONSTER_ATTACK_MIN_DISTANCE = 150; // minimum distance during cooldown

// Attack distance settings
export const MONSTER_ATTACK_DISTANCE = 25; // pixels (reduced from 50)
export const BOSS_ATTACK_DISTANCE = 60; // pixels (boss has much larger attack range)
export const BOSS_CHASE_DISTANCE = 300; // pixels (boss pursues from much further)
export const BOSS_TARGET_SWITCH_DISTANCE = 150; // pixels (distance to switch targets)

// Bat Monster (flying type)
export const MONSTER_BAT_ATTACK_BACKOFF = 1000; // 1 second - quick bite attacks
export const MONSTER_BAT_DASH_COOLDOWN = 3000; // 3 seconds - dash cooldown
export const MONSTER_BAT_DASH_FORCE = 12.0; // Strong dash for flying attack
export const MONSTER_BAT_KNOCKBACK_FORCE = 8.0;
export const MONSTER_BAT_KNOCKBACK_DURATION = 400; // ms

// Aggressive Monster (new type)
export const MONSTER_AGGRESSIVE_SPEED_PATROL = 1.0;
export const MONSTER_AGGRESSIVE_SPEED_CHASE = 2.0;
export const MONSTER_AGGRESSIVE_ATTACK_BACKOFF = 2000; // 2 seconds
export const MONSTER_AGGRESSIVE_KNOCKBACK_FORCE = 5.0;
export const MONSTER_AGGRESSIVE_KNOCKBACK_DURATION = 300; // ms

// Fast Monster (new type)
export const MONSTER_FAST_SPEED_PATROL = 1.5;
export const MONSTER_FAST_SPEED_CHASE = 2.5;
export const MONSTER_FAST_ATTACK_BACKOFF = 2000; // 2 seconds
export const MONSTER_FAST_DASH_FORCE = 8.0;
export const MONSTER_FAST_DASH_COOLDOWN = 1500; // ms

// Boss Monster (legendary type)
export const MONSTER_BOSS_SIZE = 62; // Larger than regular monsters (30% wider)
export const MONSTER_BOSS_LIVES = 20; // Much more HP than regular monsters
export const MONSTER_BOSS_SPEED_PATROL = 2.5; // Much faster patrol
export const MONSTER_BOSS_SPEED_CHASE = 4.0; // Very fast chase speed
export const MONSTER_BOSS_ATTACK_BACKOFF = 1000; // 1 second cooldown
export const MONSTER_BOSS_DASH_COOLDOWN = 2000; // 2 seconds - dash cooldown for boss
export const MONSTER_BOSS_DASH_FORCE = 15.0; // Very strong dash for boss
export const MONSTER_BOSS_ABILITY_COOLDOWN = 5000; // Special ability cooldown

// Boss Abilities
export const BOSS_ABILITY_TYPES = ['fireball', 'lightning', 'heal', 'summon', 'teleport'] as const;
export type BossAbilityType = typeof BOSS_ABILITY_TYPES[number];

// Boss Ability Parameters
export const BOSS_FIREBALL_DAMAGE = 2;
export const BOSS_FIREBALL_SPEED = 3.0;
export const BOSS_LIGHTNING_DAMAGE = 3;
export const BOSS_LIGHTNING_RANGE = 80;
export const BOSS_HEAL_AMOUNT = 5;
export const BOSS_TELEPORT_RANGE = 100;

// Props (rectangle)
export const FLASKS_COUNT = 3;
export const FLASK_SIZE = 24;

// Bullet (circle)
export const BULLET_SIZE = 8;
export const BULLET_SPEED = 4;
export const BULLET_RATE = 800; // The bigger, the slower.
