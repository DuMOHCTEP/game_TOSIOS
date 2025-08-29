import { createTexturesArray } from '../utils';
import playerDead1 from './player-dead-1.png';
import playerDead2 from './player-dead-2.png';
import playerDead3 from './player-dead-3.png';
import playerDead4 from './player-dead-4.png';
import playerIdle1 from './player-idle-1.png';
import playerIdle2 from './player-idle-2.png';
import playerIdle3 from './player-idle-3.png';
import playerIdle4 from './player-idle-4.png';

// Archer textures
import archerIdle from './archer/Archer_Idle.png';
import archerRun from './archer/Archer_Run.png';
import archerShoot from './archer/Archer_Shoot.png';

// Warrior (default character)
const playerDeadTextures = createTexturesArray([playerDead1, playerDead2, playerDead3, playerDead4]);
const playerIdleTextures = createTexturesArray([playerIdle1, playerIdle2, playerIdle3, playerIdle4]);

// Archer textures (single sprites, not animated)
const archerIdleTexture = archerIdle;
const archerRunTexture = archerRun;
const archerShootTexture = archerShoot;

export {
    playerDeadTextures,
    playerIdleTextures,
    archerIdleTexture,
    archerRunTexture,
    archerShootTexture
};
