'use strict';

// =============================================================================
// Create Player (Hero)
// =============================================================================
window.Hero = class Hero extends window.Phaser.Sprite {
  constructor(game, prevHero) {
    super();
    let heroSprite = typeof(prevHero) === 'undefined' ? 'alxdna' : prevHero.key;
    window.Phaser.Sprite.call(this, game, 27, 523, heroSprite);
    // anchor
    this.anchor.set(0.5, 0.5);
    // physics properties
    this.game.physics.enable(this);
    this.body.collideWorldBounds = true;
    // animations
    this.animations.add('stop', [0]);
    this.animations.add('run', [1, 2], 8, true); // 8fps looped
    this.animations.add('jump', [3]);
    this.animations.add('fall', [4]);
    this.animations.add('die', [5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 5, 5], 15);
    this.animations.add('demo', [0, 0, 0, 0, 0, 0, 1, 2, 1, 2, 1, 2, 1, 2, 5, 6, 5, 6, 5, 6], 8);
    // starting animation
    this.animations.play('stop');
    // setup talking and text
    let text = typeof(prevHero) === 'undefined' ? '' : prevHero.playerText._text;

    this.playerText = this.game.add.text(this.position.x - 20, this.position.y - 560, text, { fill: '#000000', fontSize: '15px', wordWrapWidth: 150, wordWrap: true, maxLines: 4, backgroundColor: 'white' });
    this.playerText.anchor.set(0.5);
    this.addChild(this.playerText);
    this.fixTextOffset();
  }

  move(direction) {
    // guard
    if (this.isFrozen) { return; }
    const SPEED = 200;

    this.body.velocity.x = direction * SPEED;

    // update image flipping & animations
    if (this.body.velocity.x < 0) {
      this.scale.x = -1;
      this.playerText.scale.x = -1;
    } else if (this.body.velocity.x > 0) {
      this.scale.x = 1;
      this.playerText.scale.x = 1;
    }
  }

  jump() {
    // Hero jumping code
    const JUMP_SPEED = 600;
    const canJump = this.body.touching.down && this.alive && !this.isFrozen;
    // console.log({
    //   canJump: canJump,
    //   'this.body.touching.down': this.body.touching.down,
    //   'this.alive': this.alive,
    //   'this.isFrozen': this.isFrozen
    // });
    if (canJump || this.isBoosting) {
      this.body.velocity.y = -JUMP_SPEED;
      this.isBoosting = true;
      jumpVar = true;
    }
    return canJump;
  }

  talk(text) {
    this.playerText.setText(text);
    this.fixTextOffset();
  }

  fixTextOffset() {
    let style = this.playerText.getBounds();
    switch (style.height) {
      case 48:
        this.playerText.y = -52;
        break;
      case 72:
        this.playerText.y = -64;
        break;
      case 96:
        this.playerText.y = -76;
        break;
      default:
        this.playerText.y = -40;
    }
  }

  update() {
    // update sprite animation, if it needs changing
    const animationName = this._getAnimationName();
    if (this.animations.name !== animationName) {
      if(animationName === 'demo') {
        this.animations.play('demo').onComplete.addOnce(function () {
          // jump after demo animation
          this.isBoosting = true;
          this.jump();
        }, this);
      } else if(animationName === 'die') {
        this.animations.play(animationName).onComplete.addOnce(function () {
          if(this.isDemo) {
            // start game
            window.createMyPubNub(0, this); // Connect to the pubnub network and run level code 0
          } else {
            // restart game
            this.game.state.restart(true, false, {level: this.level});
          }

        }, this);
      } else {
        this.animations.play(animationName);
      }
    }
  }

  freeze() { // When player goes through door do animation and remove player
    this.body.enable = false;
    this.isFrozen = true;
  }

  die() {
    this.body.enable = false;
    this.isFrozen = true;
    this.alive = false;
  }

  bounce() {
    const BOUNCE_SPEED = 200;
    this.body.velocity.y = -BOUNCE_SPEED;
  }

  // returns the animation name that should be playing depending on
  // current circumstances
  _getAnimationName() {
    let name = 'stop'; // default animation
    if (this.isFrozen) {
      name = 'stop';
      if (!this.alive) {
        name = 'die';
      }
    } else if (this.body.velocity.y < 0) {
      name = 'jump';
    } else if (this.body.velocity.y >= 0 && (!this.body.touching.down && !this.body.onFloor())) {
      name = 'fall';
    } else if (this.body.velocity.x !== 0 && this.body.touching.down) {
      name = 'run';
    } else if(this.isDemo) {
      name = 'demo';
    }

    return name;
  }
};
