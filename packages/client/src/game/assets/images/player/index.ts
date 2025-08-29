import { createTexturesArray } from '../utils';
import playerDead1 from './player-dead-1.png';
import playerDead2 from './player-dead-2.png';
import playerDead3 from './player-dead-3.png';
import playerDead4 from './player-dead-4.png';
import playerIdle1 from './player-idle-1.png';
import playerIdle2 from './player-idle-2.png';
import playerIdle3 from './player-idle-3.png';
import playerIdle4 from './player-idle-4.png';

// Archer sprite sheets
import archerIdleImage from './archer/Archer_Idle.png';
import archerRunImage from './archer/Archer_Run.png';
import archerShootImage from './archer/Archer_Shoot.png';

// Warrior (default character)
const playerDeadTextures = createTexturesArray([playerDead1, playerDead2, playerDead3, playerDead4]);
const playerIdleTextures = createTexturesArray([playerIdle1, playerIdle2, playerIdle3, playerIdle4]);

// Function to create frames from sprite sheet at runtime
export function createFramesFromSpriteSheetAtRuntime(
    texturePath: string,
    frameCount: number,
    frameWidth = 32,
    frameHeight = 32
): Promise<PIXI.Texture[]> {
    return new Promise((resolve) => {
        // Load the texture
        const baseTexture = PIXI.BaseTexture.from(texturePath);

        baseTexture.on('loaded', () => {
            const frames: PIXI.Texture[] = [];

            for (let i = 0; i < frameCount; i++) {
                const rect = new PIXI.Rectangle(
                    i * frameWidth,
                    0,
                    frameWidth,
                    frameHeight
                );
                const texture = new PIXI.Texture(baseTexture, rect);
                frames.push(texture);
            }

            resolve(frames);
        });

        baseTexture.on('error', (error) => {
            console.error(`Failed to load sprite sheet: ${texturePath}`, error);
            resolve([]);
        });
    });
}

// Archer sprite sheet configurations
export const archerSpriteSheets = {
    idle: {
        image: archerIdleImage,
        frameCount: 6,
        frameWidth: 32,
        frameHeight: 32
    },
    run: {
        image: archerRunImage,
        frameCount: 4,
        frameWidth: 32,
        frameHeight: 32
    },
    shoot: {
        image: archerShootImage,
        frameCount: 8,
        frameWidth: 32,
        frameHeight: 32
    }
};

export {
    playerDeadTextures,
    playerIdleTextures
};
