const config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 700,
    backgroundColor: '#000000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [TitleScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);