import { Constants, Maths, MonsterType } from '@tosios/common';
import { MapSchema, type } from '@colyseus/schema';
import { Circle } from './Circle';
import { Player } from '.';

type MonsterState = 'idle' | 'patrol' | 'chase' | 'cooldown';

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

    @type('number')
    private cooldownUntil: number = 0;

    @type('number')
    private attackPositionX: number = 0;

    @type('number')
    private attackPositionY: number = 0;

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

    // Cooldown state tracking
    private cooldownUntil: number = 0;
    private attackPositionX: number = 0;
    private attackPositionY: number = 0;

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
            case 'cooldown':
                this.updateCooldown(players);
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

        const distance = Maths.getDistance(this.x, this.y, player.x, player.y);

        // Did player run away?
        if (distance > Constants.MONSTER_SIGHT) {
            this.startIdle();
            return;
        }

        // AI Behavior based on monster type and distance
        this.executeSmartChaseAI(player, distance);

        // Fast monsters can dash when close enough
        if (this.monsterType === 'fast' && this.canDash && distance < 100) {
            this.startDash(player.x, player.y);
        }
    }

    private executeSmartChaseAI(player: Player, distance: number) {
        const closeDistance = 50; // Distance at which monster can attack
        const speed = this.getChaseSpeed();
        const jerkyMultiplier = this.getJerkyMovementMultiplier();

        switch (this.monsterType) {
            case 'bat':
                // Basic bat: approaches to attack distance
                this.executeBasicChase(player, distance, closeDistance, speed * jerkyMultiplier);
                break;

            case 'aggressive':
                // Aggressive: approaches quickly to attack
                this.executeAggressiveChase(player, distance, closeDistance, speed * jerkyMultiplier);
                break;

            case 'fast':
                // Fast: circles and approaches to attack
                this.executeFastChase(player, distance, closeDistance, speed * jerkyMultiplier);
                break;

            default:
                this.executeBasicChase(player, distance, closeDistance, speed * jerkyMultiplier);
                break;
        }
    }

    private executeBasicChase(player: Player, distance: number, attackDistance: number, moveSpeed: number) {
        if (distance > attackDistance + 10) {
            // Move toward player to get in attack range
            this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            this.move(moveSpeed, this.rotation);
        } else if (distance < attackDistance - 5) {
            // Too close, move away slightly
            this.rotation = Maths.calculateAngle(this.x, this.y, player.x, player.y);
            this.move(moveSpeed * 0.3, this.rotation);
        } else {
            // At attack distance - can attack when cooldown allows
            // Small random movement to avoid being completely static
            if (Math.random() < 0.02) {
                const randomAngle = Math.random() * Math.PI * 2;
                this.move(moveSpeed * 0.1, randomAngle);
            }
        }
    }

    private executeAggressiveChase(player: Player, distance: number, attackDistance: number, moveSpeed: number) {
        if (distance > attackDistance + 40) {
            // Aggressive approach - faster when far
            this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            this.move(moveSpeed * 1.3, this.rotation);
        } else if (distance > attackDistance + 10) {
            // Fast approach when getting close
            this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            this.move(moveSpeed * 0.8, this.rotation);
        } else if (distance > attackDistance) {
            // Slow approach when very close
            this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            this.move(moveSpeed * 0.2, this.rotation);
        } else if (distance < attackDistance - 3) {
            // Too close, retreat slightly
            this.rotation = Maths.calculateAngle(this.x, this.y, player.x, player.y);
            this.move(moveSpeed * 0.4, this.rotation);
        } else {
            // At attack distance - aggressive circling
            const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            const aggressiveOffset = Math.sin(Date.now() * 0.015) * 0.3;
            this.move(moveSpeed * 0.1, angleToPlayer + aggressiveOffset);
        }
    }

    private executeFastChase(player: Player, distance: number, attackDistance: number, moveSpeed: number) {
        if (distance > attackDistance + 60) {
            // Fast approach when far
        this.rotation = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            this.move(moveSpeed * 1.1, this.rotation);
        } else if (distance > attackDistance + 20) {
            // Circling behavior when medium distance
            const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            const circleOffset = Math.sin(Date.now() * 0.015) * 0.6; // Fast circular motion
            this.rotation = angleToPlayer + circleOffset;
            this.move(moveSpeed * 0.8, this.rotation);
        } else if (distance > attackDistance) {
            // Quick circling when at attack distance
            const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            const fastOffset = Math.sin(Date.now() * 0.02) * 0.4; // Very fast circling
            this.move(moveSpeed * 0.3, angleToPlayer + fastOffset);
        } else if (distance < attackDistance - 5) {
            // Quick retreat if too close
            this.rotation = Maths.calculateAngle(this.x, this.y, player.x, player.y);
            this.move(moveSpeed * 1.2, this.rotation);
        } else {
            // At attack distance - erratic movement
            const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
            const erraticOffset = Math.sin(Date.now() * 0.03) * 0.2;
            this.move(moveSpeed * 0.1, angleToPlayer + erraticOffset);
        }
    }

    updateCooldown(players: MapSchema<Player>) {
        // Check if cooldown is over
        if (Date.now() >= this.cooldownUntil) {
            // Cooldown finished, return to chase state
            this.startChase(this.targetPlayerId);
            return;
        }

        // Get current target player
        const player = getPlayerFromId(this.targetPlayerId, players);
        if (player && player.isAlive) {
            const distanceToPlayer = Maths.getDistance(this.x, this.y, player.x, player.y);
            const safeDistance = Constants.MONSTER_ATTACK_MIN_DISTANCE;

            // CRITICAL: Maintain safe distance during cooldown (150px)
            if (distanceToPlayer < safeDistance) {
                // Emergency retreat - move away from player immediately
                const angle = Maths.calculateAngle(player.x, player.y, this.x, this.y);
                const retreatSpeed = this.monsterType === 'fast' ? 2.5 : 2.0;
                this.move(retreatSpeed, angle);
                return;
            }

            // Fly around in different directions while maintaining safe distance
            this.executeCooldownFlight(player, distanceToPlayer, safeDistance);
        } else {
            // Player disconnected/died, stay near attack position
            this.stayNearAttackPosition();
        }
    }

    private executeCooldownFlight(player: Player, distanceToPlayer: number, safeDistance: number) {
        const time = Date.now() * 0.001; // Convert to seconds

        switch (this.monsterType) {
            case 'bat':
                this.executeBasicCooldownFlight(player, distanceToPlayer, safeDistance, time);
                break;
            case 'aggressive':
                this.executeAggressiveCooldownFlight(player, distanceToPlayer, safeDistance, time);
                break;
            case 'fast':
                this.executeFastCooldownFlight(player, distanceToPlayer, safeDistance, time);
                break;
            default:
                this.executeBasicCooldownFlight(player, distanceToPlayer, safeDistance, time);
                break;
        }
    }

    private executeBasicCooldownFlight(player: Player, distanceToPlayer: number, safeDistance: number, time: number) {
        // Basic bat flies in simple patterns around safe distance
        const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
        const flightOffset = Math.sin(time * 0.5) * 0.4; // Slow circular motion
        const verticalOffset = Math.cos(time * 0.3) * 0.2;

        this.move(0.8, angleToPlayer + flightOffset + verticalOffset);
    }

    private executeAggressiveCooldownFlight(player: Player, distanceToPlayer: number, safeDistance: number, time: number) {
        // Aggressive monsters fly more aggressively during cooldown
        const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
        const aggressiveOffset = Math.sin(time * 1.0) * 0.6; // More aggressive motion
        const zigzagOffset = Math.sin(time * 2.0) * 0.3; // Zigzag pattern

        this.move(1.2, angleToPlayer + aggressiveOffset + zigzagOffset);
    }

    private executeFastCooldownFlight(player: Player, distanceToPlayer: number, safeDistance: number, time: number) {
        // Fast monsters fly erratically during cooldown
        const angleToPlayer = Maths.calculateAngle(player.x, player.y, this.x, this.y);
        const fastOffset = Math.sin(time * 1.5) * 0.8; // Fast erratic motion
        const chaoticOffset = Math.sin(time * 3.0) * 0.4; // Chaotic element

        this.move(1.5, angleToPlayer + fastOffset + chaoticOffset);
    }



    private stayNearAttackPosition() {
        const distanceFromAttackPos = Maths.getDistance(this.x, this.y, this.attackPositionX, this.attackPositionY);

        if (distanceFromAttackPos > 40) {
            const angle = Maths.calculateAngle(this.attackPositionX, this.attackPositionY, this.x, this.y);
            this.move(0.2, angle);
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

    public applyKnockback(fromX: number, fromY: number, isAttackKnockback: boolean = false) {
        const angle = Maths.calculateAngle(fromX, fromY, this.x, this.y);

        let knockbackForce: number;
        let knockbackDuration: number;

        if (isAttackKnockback) {
            // Stronger knockback for attack to reach 150px distance
            knockbackForce = Constants.MONSTER_ATTACK_KNOCKBACK_FORCE;
            knockbackDuration = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_DURATION;
        } else {
            // Regular knockback (for collisions or other effects)
            knockbackForce = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_FORCE;
            knockbackDuration = Constants.MONSTER_AGGRESSIVE_KNOCKBACK_DURATION;

            // Adjust based on monster type for regular knockback
            switch (this.monsterType) {
                case 'bat':
                    knockbackForce *= 0.7;
                    knockbackDuration *= 0.8;
                    break;
                case 'aggressive':
                    // Full knockback force for aggressive monsters
                    break;
                case 'fast':
                    knockbackForce *= 0.5;
                    knockbackDuration *= 0.6;
                    break;
            }
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

    startCooldown(playerId: string, attackX: number, attackY: number) {
        this.state = 'cooldown';
        this.targetPlayerId = playerId;
        this.attackPositionX = attackX;
        this.attackPositionY = attackY;
        this.cooldownUntil = Date.now() + this.getAttackCooldown();
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

    attack(playerX: number, playerY: number) {
        this.lastAttackAt = Date.now();
        // Start cooldown state after attack
        this.startCooldown(this.targetPlayerId, playerX, playerY);
    }

    // Getters
    get isAlive(): boolean {
        return this.lives > 0;
    }

    get canAttack(): boolean {
        const delta = Math.abs(this.lastAttackAt - Date.now());
        return this.state === 'chase' && delta > this.getAttackCooldown() && !this.isDashing && Date.now() >= this.cooldownUntil;
    }

    get canDash(): boolean {
        return !this.isDashing && Date.now() - this.lastDashAt > Constants.MONSTER_FAST_DASH_COOLDOWN && this.state === 'chase';
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
