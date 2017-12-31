'use strict';

// =============================================================================
// Create Spider
// =============================================================================

window.Spider = class Spider extends window.Phaser.Sprite {
  constructor(game, x, y) {
    super();
    window.Phaser.Sprite.call(this, game, x, y, 'spider');
    // anchor
    this.anchor.set(0.5);
    // animation
    this.animations.add('crawl', [0, 1, 2], 8, true);
    this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
    this.animations.play('crawl');

    // physic properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    this.speed = 100;
    this.body.velocity.x = this.speed;
  }

  die() {
    this.body.enable = false;
    
    this.animations.play('die').onComplete.addOnce(function () {
      this.kill();
    }, this);
  }

  update() {
    // check against walls and reverse direction if necessary
    if (this.body.touching.right || this.body.blocked.right) {
        this.body.velocity.x = -this.speed; // turn left
    }
    else if (this.body.touching.left || this.body.blocked.left) {
        this.body.velocity.x = this.speed; // turn right
    }
  }

};
