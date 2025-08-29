import { Container, Sprite, Graphics, DisplayObject } from 'pixi.js';

export interface AnimationConfig {
    duration: number;
    easing?: (t: number) => number;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
}

export interface TeleportAnimationConfig extends AnimationConfig {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    sprite: Sprite;
    container: Container;
}

export interface KnockbackAnimationConfig extends AnimationConfig {
    startX: number;
    startY: number;
    distance: number;
    direction: number;
    sprite: Sprite;
}

// Система плавных анимаций
export class AnimationSystem {
    private static animations: Map<string, any> = new Map();

    // Плавная анимация телепортации
    static animateTeleport(config: TeleportAnimationConfig): string {
        const animationId = `teleport_${Date.now()}_${Math.random()}`;

        const startTime = Date.now();
        const { duration, startX, startY, endX, endY, sprite, container, easing = this.easeOutCubic, onUpdate, onComplete } = config;

        // Создаем эффект исчезновения
        const fadeOutEffect = new Graphics();
        fadeOutEffect.beginFill(0xffffff, 0.3);
        fadeOutEffect.drawCircle(0, 0, sprite.width * 0.6);
        fadeOutEffect.endFill();
        fadeOutEffect.position.set(sprite.x, sprite.y);
        container.addChild(fadeOutEffect);

        // Создаем эффект появления
        const fadeInEffect = new Graphics();
        fadeInEffect.beginFill(0x00ffff, 0.4);
        fadeInEffect.drawCircle(0, 0, sprite.width * 0.8);
        fadeInEffect.endFill();
        fadeInEffect.position.set(endX, endY);
        fadeInEffect.alpha = 0;
        container.addChild(fadeInEffect);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);

            if (progress < 0.5) {
                // Первая половина - исчезновение
                const fadeProgress = progress * 2;
                sprite.alpha = 1 - fadeProgress;
                fadeOutEffect.alpha = fadeProgress;
                fadeOutEffect.scale.set(1 + fadeProgress * 0.5);
            } else {
                // Вторая половина - появление
                const fadeProgress = (progress - 0.5) * 2;
                sprite.alpha = fadeProgress;
                sprite.x = startX + (endX - startX) * easing(fadeProgress);
                sprite.y = startY + (endY - startY) * easing(fadeProgress);

                fadeOutEffect.alpha = 1 - fadeProgress;
                fadeInEffect.alpha = fadeProgress;
                fadeInEffect.scale.set(1 + fadeProgress * 0.3);
            }

            onUpdate?.(progress);

            if (progress >= 1) {
                // Завершение анимации
                sprite.alpha = 1;
                sprite.x = endX;
                sprite.y = endY;

                container.removeChild(fadeOutEffect);
                container.removeChild(fadeInEffect);

                fadeOutEffect.destroy();
                fadeInEffect.destroy();

                onComplete?.();
                this.animations.delete(animationId);
            } else {
                requestAnimationFrame(animate);
            }
        };

        animate();
        this.animations.set(animationId, { animate, startTime });
        return animationId;
    }

    // Анимация отскока (knockback)
    static animateKnockback(config: KnockbackAnimationConfig): string {
        const animationId = `knockback_${Date.now()}_${Math.random()}`;

        const startTime = Date.now();
        const { duration, startX, startY, distance, direction, sprite, easing = this.easeOutBack, onUpdate, onComplete } = config;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = easing(progress);
            const currentDistance = distance * easedProgress;

            sprite.x = startX + Math.cos(direction) * currentDistance;
            sprite.y = startY + Math.sin(direction) * currentDistance;

            // Добавляем эффект тряски
            const shake = (1 - progress) * 3;
            sprite.x += (Math.random() - 0.5) * shake;
            sprite.y += (Math.random() - 0.5) * shake;

            onUpdate?.(progress);

            if (progress >= 1) {
                onComplete?.();
                this.animations.delete(animationId);
            } else {
                requestAnimationFrame(animate);
            }
        };

        animate();
        this.animations.set(animationId, { animate, startTime });
        return animationId;
    }

    // Быстрая анимация рывка (dash)
    static animateDash(startX: number, startY: number, endX: number, endY: number, sprite: Sprite, duration: number = 200): string {
        const animationId = `dash_${Date.now()}_${Math.random()}`;

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = this.easeOutQuad(progress);

            sprite.x = startX + (endX - startX) * easedProgress;
            sprite.y = startY + (endY - startY) * easedProgress;

            // Эффект размытия во время рывка
            sprite.alpha = 0.8 + 0.2 * Math.sin(progress * Math.PI * 4);

            if (progress >= 1) {
                sprite.alpha = 1;
                this.animations.delete(animationId);
            } else {
                requestAnimationFrame(animate);
            }
        };

        animate();
        this.animations.set(animationId, { animate, startTime });
        return animationId;
    }

    // Остановка анимации
    static stopAnimation(animationId: string) {
        const animation = this.animations.get(animationId);
        if (animation) {
            this.animations.delete(animationId);
        }
    }

    // Остановка всех анимаций
    static stopAllAnimations() {
        this.animations.clear();
    }

    // Функции easing
    static easeOutCubic(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }

    static easeOutQuad(t: number): number {
        return 1 - (1 - t) * (1 - t);
    }

    static easeOutBack(t: number): number {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    static easeInOutSine(t: number): number {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }
}

// Удобные функции для быстрого использования
export const animateTeleport = AnimationSystem.animateTeleport.bind(AnimationSystem);
export const animateKnockback = AnimationSystem.animateKnockback.bind(AnimationSystem);
export const animateDash = AnimationSystem.animateDash.bind(AnimationSystem);
export const stopAnimation = AnimationSystem.stopAnimation.bind(AnimationSystem);
export const stopAllAnimations = AnimationSystem.stopAllAnimations.bind(AnimationSystem);

// Специализированные эффекты для монстров
export class MonsterEffects {
    // Эффект телепортации для боссов
    static bossTeleport(container: Container, x: number, y: number, radius: number): string {
        const effectId = `boss_teleport_${Date.now()}_${Math.random()}`;

        // Создаем серию вспышек
        const flashCount = 3;
        let flashIndex = 0;

        const createFlash = () => {
            if (flashIndex >= flashCount) return;

            const flash = new Graphics();
            flash.beginFill(0x00ffff, 0.6);
            flash.drawCircle(0, 0, radius * (1 + flashIndex * 0.3));
            flash.endFill();
            flash.position.set(x, y);
            flash.alpha = 1;
            container.addChild(flash);

            // Анимация вспышки
            const animateFlash = () => {
                flash.alpha -= 0.05;
                flash.scale.set(flash.scale.x + 0.02);

                if (flash.alpha <= 0) {
                    container.removeChild(flash);
                    flash.destroy();

                    flashIndex++;
                    if (flashIndex < flashCount) {
                        setTimeout(createFlash, 100);
                    }
                } else {
                    requestAnimationFrame(animateFlash);
                }
            };

            animateFlash();
        };

        createFlash();
        return effectId;
    }

    // Эффект отскока при невозможности атаки
    static knockbackEffect(container: Container, x: number, y: number, direction: number): string {
        const effectId = `knockback_effect_${Date.now()}_${Math.random()}`;

        // Создаем эффект частиц
        const particleCount = 5;
        const particles: Graphics[] = [];

        for (let i = 0; i < particleCount; i++) {
            const particle = new Graphics();
            particle.beginFill(0xff4444, 0.7);
            particle.drawCircle(0, 0, 3);
            particle.endFill();

            particle.x = x;
            particle.y = y;
            particle.alpha = 1;

            container.addChild(particle);
            particles.push(particle);
        }

        // Анимация частиц
        const animateParticles = () => {
            let allDone = true;

            particles.forEach((particle, index) => {
                const angle = direction + (index - particleCount / 2) * 0.5;
                const speed = 2 + Math.random() * 2;
                const distance = 20 + Math.random() * 30;

                particle.x += Math.cos(angle) * speed;
                particle.y += Math.sin(angle) * speed;
                particle.alpha -= 0.03;

                if (particle.alpha > 0) {
                    allDone = false;
                } else {
                    container.removeChild(particle);
                    particle.destroy();
                }
            });

            if (!allDone) {
                requestAnimationFrame(animateParticles);
            }
        };

        animateParticles();
        return effectId;
    }

    // Эффект "не могу атаковать" - пульсирующий красный круг
    static cantAttackIndicator(container: Container, x: number, y: number, radius: number): string {
        const effectId = `cant_attack_${Date.now()}_${Math.random()}`;

        const indicator = new Graphics();
        indicator.position.set(x, y);
        container.addChild(indicator);

        let time = 0;
        const animate = () => {
            time += 0.1;

            indicator.clear();
            indicator.lineStyle(3, 0xff0000, 0.8 + Math.sin(time) * 0.2);
            indicator.drawCircle(0, 0, radius * 1.2);

            // Добавляем восклицательный знак
            indicator.lineStyle(2, 0xff0000, 1);
            indicator.moveTo(0, -radius * 0.8);
            indicator.lineTo(0, radius * 0.8);
            indicator.moveTo(0, radius * 0.2);
            indicator.lineTo(0, radius * 0.8);

            requestAnimationFrame(animate);
        };

        animate();

        // Автоматически удаляем через 2 секунды
        setTimeout(() => {
            container.removeChild(indicator);
            indicator.destroy();
        }, 2000);

        return effectId;
    }
}
