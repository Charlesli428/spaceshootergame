class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.image('background', 'assets/images/background_tiled_vertical.png');
    }

    create() {
        this.bg = this.add.tileSprite(
            0, 0,
            this.scale.width,
            this.scale.height,
            'background'
        ).setOrigin(0).setScrollFactor(0);

        // Debug placeholder text to show game started
        this.add.text(this.scale.width / 2, 50, 'Game Running...', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // TEMP: Simulate game over after 5 seconds
        this.time.delayedCall(5000, () => {
            this.scene.start('GameOverScene');
        });
    }

    update() {
        this.bg.tilePositionY -= 1; // scrolling speed
    }
}
