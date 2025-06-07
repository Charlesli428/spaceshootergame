class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('background', 'assets/images/background_tiled_vertical.png');
        this.load.image('player', 'assets/images/mainship.png');
        this.load.image('bullet', 'assets/images/player_laser.png');
        this.load.image('laser', 'assets/images/enemy_laser.png');
        this.load.image('enemyBee', 'assets/images/galaga_enemy_bee.png');
        this.load.image('enemyBossRed', 'assets/images/galaga_enemy_boss_red.png');
        this.load.audio('firing', 'assets/sfx/firing.mp3');
        this.load.image('explosion', 'assets/images/explosion.png');
        this.load.audio('explosionSound', 'assets/sfx/kill.mp3');
    }
d
    create() {
        // Controls
        this.keys = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            shoot: 'SPACE',
            returnToTitle: 'T',
            play: 'P'
        });

        // Audio
        this.fireSound = this.sound.add('firing');
        this.explosionSound = this.sound.add('explosionSound');

        // Background
        this.bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background')
            .setOrigin(0)
            .setScrollFactor(0);

        // Player
        this.player = this.add.sprite(400, 630, 'player').setScale(0.05);

        // Bullets
        this.bullets = this.physics.add.group();
        this.bulletCooldown = 0;
        this.bulletCooldownDelay = 10;

        // Enemies
        this.enemies = this.physics.add.group();
        const rows = 4;
        const cols = 8;
        const offsetX = 100;
        const offsetY = 100;
        const spacingX = 80;
        const spacingY = 70;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = offsetX + col * spacingX;
                const y = offsetY + row * spacingY;
                const type = (row === 0) ? 'enemyBossRed' : 'enemyBee';
                const enemy = this.enemies.create(x, y, type).setScale(0.06).setOrigin(0.5);
                enemy.originalY = y;
            }
        }

        // Bullet vs Enemy collision
        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            bullet.destroy();
            enemy.destroy();

            //explosion visual
            const explosion = this.add.sprite(enemy.x, enemy.y, 'explosion').setScale(0.1);
            this.time.delayedCall(200, () => explosion.destroy());

            // explosion sound
            this.explosionSound.play();
        });
    }

    update() {
        // Background scroll
        this.bg.tilePositionY -= 1;

        // Player movement
        this.player.x = Phaser.Math.Clamp(this.player.x, 0, 1400);
        if (this.keys.left.isDown) {
            this.player.x -= 6;
        }
        if (this.keys.right.isDown) {
            this.player.x += 6;
        }

        // Shoot bullets
        if (
            Phaser.Input.Keyboard.JustDown(this.keys.shoot) &&
            this.bullets.countActive(true) < 2 &&
            this.bulletCooldown === 0
        ) {
            this.bullets.create(this.player.x, this.player.y - 30, 'bullet')
                .setScale(0.045);
            this.bulletCooldown = this.bulletCooldownDelay;
            this.fireSound.play();
        }

        // Cooldown decrement
        if (this.bulletCooldown > 0) {
            this.bulletCooldown--;
        }

        // Move bullets & destroy offscreen
        this.bullets.children.each(bullet => {
            bullet.y -= 16;
            if (bullet.y < 0) bullet.destroy();
        });
    }
}
