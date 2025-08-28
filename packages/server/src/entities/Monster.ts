import { Constants, Maths, MonsterType } from '@tosios/common';
import { MapSchema, type } from '@colyseus/schema';
import { Circle } from './Circle';
import { Player } from '.';

type MonsterState = 'idle' | 'patrol' | 'chase';

export class Monster extends Circle {
    @type('number')
    private rotation: number = 0;

    @type('string')
    private monsterType: MonsterType = 'bat';

    @type('number')
    private knockbackX: number = 0;

    @type('number')
    private knockbackY: number = 0;

    @type('boolean')
    private isDashing: boolean = false;

    // Hidden properties
    private mapWidth: number;

    private mapHeight: number;

    private lives: number = 0;

    private state: MonsterState = 'idle';

    private lastActionAt: number = Date.now();

    private lastAttackAt: number = Date.now();

    private idleDuration: number = 0;

    private patrolDuration: number = 0;

    private targetPlayerId: string = null;

    // New monster type system
    private monsterType: MonsterType = 'bat';

    // Knockback system for aggressive monsters
    private knockbackX: number = 0;
    private knockbackY: number = 0;
    private knockbackUntil: number = 0;

    // Dash system for fast monsters
    private isDashing: boolean = false;
    private lastDashAt: number = 0;
    private dashDirectionX: number = 0;
    private dashDirectionY: number = 0;

    // Movement variation for jerky movement
    private movementVariation: number = 0;
    private lastMovementChange: number = Date.now();

    // Init
    constructor(x: number, y: number, radius: number, mapWidth: number, mapHeight: number, lives: number, monsterType?: MonsterType) {
        super(x, y, radius);

        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.lives = lives;
        this.monsterType = monsterType || 'bat';
    }

    // Update
    update(players: MapSchema<Player>) {
        // Handle knockback for aggressive monsters
        this.updateKnockback();

        // Handle dash for fast monsters
        this.updateDash();

        switch (this.state) {
            case 'idle':
                this.updateIdle(players);
                break;
            case 'patrol':
                this.updatePatrol(players);
                break;
            case 'chase':
                this.updateChase(players);
                break;
            default:
                break;
        }
    }

    updateIdle(players: MapSchema<Player>) {
        // Look for a player to chase
        if (this.lookForPlayer(players)) {
            return;
        }

        // Is state over?
        const delta = Date.now() - this.lastActionAt;
        if (delta > this.idleDuration) {
            this.startPatrol();
        }
    }

    updatePatrol(players: MapSchema<Player>) {
        // Look for a player to chase
        if (this.lookForPlayer(players)) {
            return;
        }

        // Is state over?
        const delta = Date.now() - this.lastActionAt;
        if (delta > this.patrolDuration) {
            this.startIdle();
            return;
        }

        // Move monster with jerky movement
        const speed = this.getPatrolSpeed();
        const jerkyMultiplier = this.getJerkyMovementMultiplier();
        this.move(speed * jerkyMultiplier, this.rotation);

        // Is the monster out of bounds?
        if (
            this.x < Constants.TILE_SIZE ||
            this.x > this.mapWidth - Constants.TILE_SIZE ||
            this.y < Constants.TILE_SIZE ||
            this.y > this.mapHeight - Constants.TILE_SIZE
        ) {
            this.x = Maths.clamp(this.x, 0, this.mapWidth);
            this.y = Maths.clamp(this.y, 0, this.mapHeight);
            this.rotation = Maths.getRandomInt(-3, 3);
        }
    }

    updateChase(players: MapSchema<Player>) {
        // Did player disconnect or die?
        const player = getPlayerFromId(this.targetPlayerId, players);
        if (!player || !player.isAlive) {
            this.startIdle();
            return;
        }

        // Did player run away?
        const distance = Maths.getDistance(this.x, this.y, player.x, player.y);
        if (distance > Constants.MONSTER_SIGHT) {
            this.startIdle();
            return;
        }

        // Move toward player based on monster type
        this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);

        const speed = this.getChaseSpeed();
        const jerkyMultiplier = this.getJerkyMovementMultiplier();

        this.move(speed * jerkyMultiplier, this.rotation);

        // Fast monsters can dash
        if (this.monsterType === 'fast' && this.canDash()) {
            this.startDash(player.x, player.y);
        }
    }

    // New monster mechanics
    private updateKnockback() {
        if (Date.now() < this.knockbackUntil) {
            this.x += this.knockbackX;
            this.y += this.knockbackY;

            // Gradually reduce knockback force
            this.knockbackX *= 0.85;
            this.knockbackY *= 0.85;
        } else {
            this.knockbackX = 0;
            this.knockbackY = 0;
        }
    }

    private updateDash() {
        if (this.isDashing) {
            this.x += this.dashDirectionX;
            this.y += this.dashDirectionY;

            // Gradually reduce dash force
            this.dashDirectionX *= 0.9;
            this.dashDirectionY *= 0.9;

            // Stop dash if force is too low
            if (Math.abs(this.dashDirectionX) < 0.1 && Math.abs(this.dashDirectionY) < 0.1) {
                this.isDashing = false;
            }
        }
    }

    private getChaseSpeed(): number {
        switch (this.monsterType) {
            case 'aggressive':
                return Constants.MONSTER_AGGRESSIVE_SPEED_CHASE;
            case 'fast':
                return Constants.MONSTER_FAST_SPEED_CHASE;
            default:
                return Constants.MONSTER_SPEED_CHASE;
        }
    }

    private getPatrolSpeed(): number {
        switch (this.monsterType) {
            case 'aggressive':
                return Constants.MONSTER_AGGRESSIVE_SPEED_PATROL;
            case 'fast':
                return Constants.MONSTER_FAST_SPEED_PATROL;
            default:
                return Constants.MONSTER_SPEED_PATROL;
        }
    }

    private getAttackCooldown(): number {
        switch (this.monsterType) {
            case 'aggressive':
                return Constants.MONSTER_AGGRESSIVE_ATTACK_BACKOFF;
            case 'fast':
                return Constants.MONSTER_FAST_ATTACK_BACKOFF;
            default:
                return Constants.MONSTER_ATTACK_BACKOFF;
        }
    }

    private getJerkyMovementMultiplier(): number {
        // Change movement variation every 200-500ms for jerky effect
        if (Date.now() - this.lastMovementChange > Maths.getRandomInt(200, 500)) {
            this.movementVariation = Maths.getRandomInt(70, 130) / 100; // 0.7 to 1.3
            this.lastMovementChange = Date.now();
        }
        return this.movementVariation;
    }

    private canDash(): boolean {
        return !this.isDashing && Date.now() - this.lastDashAt > Constants.MONSTER_FAST_DASH_COOLDOWN;
    }

    private startDash(targetX: number, targetY: number) {
        this.isDashing = true;
        this.lastDashAt = Date.now();

        const angle = Maths.calculateAngle(targetX, targetY, this.x, this.y);
        this.dashDirectionX = Math.cos(angle) * Constants.MONSTER_FAST_DASH_FORCE;
        this.dashDirectionY = Math.sin(angle) * Constants.MONSTER_FAST_DASH_FORCE;
    }

    public applyKnockback(fromX: number, fromY: number) {
        const angle = Maths.calculateAngle(fromX, fromY, this.x, this.y);

        // Different knockback forces for different monster types
        let knockbackForce = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_FORCE;
        let knockbackDuration = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_DURATION;

        switch (this.monsterType) {
            case 'bat':
                knockbackForce = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_FORCE * 0.7; // Slightly less for basic bats
                knockbackDuration = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_DURATION * 0.8;
                break;
            case 'aggressive':
                // Full knockback force for aggressive monsters
                break;
            case 'fast':
                knockbackForce = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_FORCE * 0.5; // Less for fast monsters
                knockbackDuration = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_DURATION * 0.6;
                break;
        }

        this.knockbackX = Math.cos(angle) * knockbackForce;
        this.knockbackY = Math.sin(angle) * knockbackForce;
        this.knockbackUntil = Date.now() + knockbackDuration;
    }

    // States
    startIdle() {
        this.state = 'idle';
        this.rotation = 0;
        this.targetPlayerId = null;
        this.idleDuration = Maths.getRandomInt(
            Constants.MONSTER_IDLE_DURATION_MIN,
            Constants.MONSTER_IDLE_DURATION_MAX,
        );
        this.lastActionAt = Date.now();
    }

    startPatrol() {
        this.state = 'patrol';
        this.targetPlayerId = null;
        this.patrolDuration = Maths.getRandomInt(
            Constants.MONSTER_PATROL_DURATION_MIN,
            Constants.MONSTER_PATROL_DURATION_MAX,
        );
        this.rotation = Maths.getRandomInt(-3, 3);
        this.lastActionAt = Date.now();
        this.isDashing = false; // Reset dash state
    }

    startChase(playerId: string) {
        this.state = 'chase';
        this.targetPlayerId = playerId;
        this.lastActionAt = Date.now();
    }

    // Methods
    lookForPlayer(players: MapSchema<Player>): boolean {
        if (!this.targetPlayerId) {
            const playerId = getClosestPlayerId(this.x, this.y, players);
            if (playerId) {
                this.startChase(playerId);
                return true;
            }
        }

        return false;
    }

    hurt() {
        this.lives -= 1;
    }

    move(speed: number, rotation: number) {
        this.x += Math.cos(rotation) * speed;
        this.y += Math.sin(rotation) * speed;
    }

    attack() {
        this.lastAttackAt = Date.now();
    }

    // Getters
    get isAlive(): boolean {
        return this.lives > 0;
    }

    get canAttack(): boolean {
        const delta = Math.abs(this.lastAttackAt - Date.now());
        return this.state === 'chase' && delta > this.getAttackCooldown() && !this.isDashing;
    }

    // New getters for client synchronization
    get type(): MonsterType {
        return this.monsterType;
    }

    get knockbackXValue(): number {
        return this.knockbackX;
    }

    get knockbackYValue(): number {
        return this.knockbackY;
    }

    get isCurrentlyDashing(): boolean {
        return this.isDashing;
    }
}

function getPlayerFromId(id: string, players: MapSchema<Player>): Player | null {
    return players.get(id);
}

function getClosestPlayerId(x: number, y: number, players: MapSchema<Player>): string | null {
    let selectedPlayerId = null;

    players.forEach((player, playerId) => {
        if (player.isAlive) {
            const distance = Maths.getDistance(x, y, player.x, player.y);
            if (distance <= Constants.MONSTER_SIGHT) {
                selectedPlayerId = playerId;
            }
        }
    });

    return selectedPlayerId;
}
