class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('background', 'assets/images/background_tiled_vertical.png');
        this.load.image('player', 'assets/images/mainship.png');
        this.load.image('bullet', 'assets/images/player_laser.png');
        this.load.image('laser', 'assets/images/enemy_laser.png');
        this.load.image('safemarker', 'assets/images/spaceBuilding_015.png');
    }

    create() {
        this.keys = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            shoot: 'SPACE',
            returnToTitle: 'T',
            play: 'P'
        });

        this.bullets = [];
        this.bulletCooldown = 0;
        this.bulletCooldownDelay = 45;

        
        this.bg = this.add.tileSprite(
            0, 0,
            this.scale.width,
            this.scale.height,
            'background'
        ).setOrigin(0).setScrollFactor(0);
        this.player = this.add.sprite(400, 630, 'player').setScale(0.07);
        this.safemarker = this.add.sprite(1350, 50, 'safemarker').setScale(0.5);
        this.safemarker = this.add.sprite(250, 50, 'safemarker').setScale(0.5);
        /*this.add.text(this.scale.width / 2, 50, 'Game Running...', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.time.delayedCall(5000, () => {
            this.scene.start('GameOverScene');
        });*/
    }

    update() {
        this.bg.tilePositionY -= 1; // scrolling speed
        this.player.x = Phaser.Math.Clamp(this.player.x, 0, 1600);
        this.keys = this.input.keyboard.addKeys({
            left: 'A',
            right: 'D',
            shoot: 'SPACE'
        });
        if (this.keys.left.isDown) {
            this.player.x -= 2.6;
        }
        if (this.keys.right.isDown) {
            this.player.x += 2.6;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.shoot) && this.bulletCooldown === 0) {
            const bullet = this.add.sprite(this.player.x, this.player.y - 30, 'bullet').setScale(0.07);
            this.bullets.push(bullet);
            this.bulletCooldown = this.bulletCooldownDelay;
        }

        if (this.bulletCooldown > 0) {
            this.bulletCooldown--;
        }

        // Move bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.y -= 7;

            // Remove bullets that go off screen
            if (bullet.y < 0) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
        }
}
