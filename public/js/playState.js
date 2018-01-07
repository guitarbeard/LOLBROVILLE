'use strict';

// =============================================================================
// Play state
// =============================================================================
const keyStates = {};
let keyCollected = false;
var leftSideDown;
var jumpVar = true;
var leftSideVar = true;
var rightSideVar = true;

window.frameCounter = 0;

function logCurrentStateCoin(game, coin) {
  // Log Current Game State of Collected Coins
  for (const value of window.globalLevelState.cache.coins) {
    if (coin.x === value.x && coin.y === value.y) {
      window.globalLevelState.cache.coins.splice(window.globalLevelState.cache.coins.indexOf(value), 1);
      // console.log(value)
    }
  }
  window.fireUpdateState();
  // console.log(window.globalLevelState.cache.coins)
}

function logCurrentStateSpider(game, spider) {
  // Log Current Game State of Spiders
  for (const value of window.globalLevelState.cache.spiders) {
    if (spider.id === value.id) {
      window.globalLevelState.cache.spiders.splice(window.globalLevelState.cache.spiders.indexOf(value), 1);
      // console.log(value)
    }
  }
  window.fireUpdateState();
  // console.log(window.globalLevelState.cache.spiders)
}

function handleKeyMessages() {
  const earlyMessages = [];
  const lateMessages = [];
  window.keyMessages.forEach((messageEvent) => {
    if (window.globalOtherHeros) { // If player exists
      if (messageEvent.channel === window.currentChannelName) { // If the messages channel is equal to your current channel
        if (!window.globalOtherHeros.has(messageEvent.message.uuid)) { // If the message isn't equal to your uuid
          window.globalGameState._addOtherCharacter(messageEvent.message.uuid); // Add another player to the game that is not yourself

          const otherplayer = window.globalOtherHeros.get(messageEvent.message.uuid);
          otherplayer.position.set(messageEvent.message.hero.position.x, messageEvent.message.hero.position.y); // set the position of each player according to x y
          otherplayer.initialRemoteFrame = messageEvent.message.frameCounter;
          otherplayer.initialLocalFrame = window.frameCounter;
          window.sendKeyMessage({}); // Send publish to all clients about user information
        }
        if (messageEvent.message.hero && window.globalOtherHeros.has(messageEvent.message.uuid)) { // If the message contains the player and the player has a uuid that matches with one in the level
          window.keyMessages.push(messageEvent);
          const otherplayer = window.globalOtherHeros.get(messageEvent.message.uuid);
          otherplayer.talk(messageEvent.message.hero.playerText, 0);
          otherplayer.loadTexture(messageEvent.message.hero.key);
          const frameDelta = messageEvent.message.frameCounter - otherplayer.lastKeyFrame;
          const initDelta = otherplayer.initialRemoteFrame - otherplayer.initialLocalFrame;
          const frameDelay = (messageEvent.message.frameCounter - window.frameCounter) - initDelta + window.syncOtherPlayerFrameDelay;

          /*console.log({
            lastKeyFrame: otherplayer.lastKeyFrame,
            frameCounter: messageEvent.message.frameCounter,
            frameDelta,
            rf_lf: otherplayer.initialRemoteFrame - otherplayer.initialLocalFrame,
            frameDelay
          });*/

          if (frameDelay > 0) {
            if (!messageEvent.hasOwnProperty('frameDelay')) {
              messageEvent.frameDelay = frameDelay;
              otherplayer.totalRecvedFrameDelay += frameDelay;
              otherplayer.totalRecvedFrames++;
            //console.log('avgFrameDelay', otherplayer.totalRecvedFrameDelay / otherplayer.totalRecvedFrames);
            }
            earlyMessages.push(messageEvent);
            //console.log('initDelta', initDelta, 'early', frameDelay);
            //console.log('early', frameDelay);
            return;
          } else if (messageEvent.message.keyMessage.stopped === 'not moving') {
            //console.log('initDelta', initDelta, 'stopping player');
            otherplayer.body.position.set(messageEvent.message.hero.position.x, messageEvent.message.hero.position.y);
            otherplayer.body.velocity.set(0, 0);
            otherplayer.goingLeft = false;
            otherplayer.goingRight = false;
            if (otherplayer.totalRecvedFrames > 0) {
              const avgFrameDelay = otherplayer.totalRecvedFrameDelay / otherplayer.totalRecvedFrames;
              const floorFrameDelay = Math.floor(avgFrameDelay);
            //console.log('otherplayer.initialRemoteFrame before', otherplayer.initialRemoteFrame);
              otherplayer.initialRemoteFrame += floorFrameDelay - 7;
            //console.log('otherplayer.initialRemoteFrame after', otherplayer.initialRemoteFrame);
              //console.log('avg frame delay', avgFrameDelay, 'adjusting delta', floorFrameDelay);
            }
            otherplayer.totalRecvedFrameDelay = 0;
            otherplayer.totalRecvedFrames = 0;
          } else if (frameDelay < 0) {
            otherplayer.totalRecvedFrameDelay += frameDelay;
            otherplayer.totalRecvedFrames++;
            lateMessages.push(messageEvent);
            //console.log('initDelta', initDelta, 'late', frameDelay);
            return;
          } else {
          //console.log('initDelta', initDelta, 'ontime', frameDelay);
          }

          otherplayer.lastKeyFrame = messageEvent.message.frameCounter;
          // otherplayer.position.set(messageEvent.message.position.x, messageEvent.message.position.y); // set the position of each player according to x y
          // if(otherplayer.position.y >525){ //If the physics pushes a player through the ground, and a message is receieved at a y less than 525, adjust the players position
          //    console.log("glitch")
          //    otherplayer.position.set(otherplayer.position.x, otherplayer.position + 75)
          // }
          if (messageEvent.message.keyMessage.up === 'down') { // If message equals arrow up, make the player jump with the correct UUID
            otherplayer.jump();
            otherplayer.jumpStart = Date.now();
          } else if (messageEvent.message.keyMessage.up === 'up') {
            otherplayer.jumpStart = 0;
          }
          if (messageEvent.message.keyMessage.left === 'down') { // If message equals arrow left, make the player move left with the correct UUID
            otherplayer.goingLeft = true;
          } else if (messageEvent.message.keyMessage.left === 'up') {
            otherplayer.goingLeft = false;
          }
          if (messageEvent.message.keyMessage.right === 'down') { // If message equals arrow down, make the player move right with the correct UUID
            otherplayer.goingRight = true;
          } else if (messageEvent.message.keyMessage.right === 'up') {
            otherplayer.goingRight = false;
          }
        }
      }
    }
  });

  if (lateMessages.length > 0) {
  //console.log({ lateMessages, earlyMessages });
  }
  window.keyMessages.length = 0;
  earlyMessages.forEach((em) => {
    window.keyMessages.push(em);
  });
}

window.PlayState = {
  init(data) {
    this.keys = this.game.input.keyboard.addKeys({
      left: window.Phaser.KeyCode.LEFT,
      right: window.Phaser.KeyCode.RIGHT,
      up: window.Phaser.KeyCode.UP,
    });
    this.game.input.keyboard.addCallbacks(this, null, this.handleChat, null);
    this.coinPickupCount = 0;
    this.maxTalkLength = 100;
    keyCollected = false;
    this.level = (data.level || 0);
  },

  create() {
    window.globalGameState = this;

    // fade in  (from black)
    this.camera.flash('#000000');
    // create sound entities
    this.sfx = {
      jump: this.game.add.audio('sfx:jump'),
      coin: this.game.add.audio('sfx:coin'),
      key: this.game.add.audio('sfx:key'),
      stomp: this.game.add.audio('sfx:stomp'),
      door: this.game.add.audio('sfx:door')
    };

    for (var key in this.sfx) {
      // skip loop if the property is from prototype
      if (!this.sfx.hasOwnProperty(key)) continue;

      var obj = this.sfx[key];
      for (var prop in obj) {
          // skip loop if the property is from prototype
          if(!obj.hasOwnProperty(prop)) continue;

          // your code
          obj.volume = 0.5;
      }
    }

    this.bgm = this.game.add.audio('bgm');
    this.bgm.loop = true;
    this.bgm.volume += 2;
    // create level entities and decoration
    this.game.add.image(0, 0, 'background');
    window.textObject1 = this.game.add.text(700, 5, window.text1, { font: 'Bold 200px Arial', fill: '#000000', fontSize: '20px' });
    window.textObject2 = this.game.add.text(700, 35, window.text2, { font: 'Bold 200px Arial', fill: '#000000', fontSize: '20px' });
    window.textObject3 = this.game.add.text(700, 65, window.text3, { font: 'Bold 200px Arial', fill: '#000000', fontSize: '20px' });
    if (window.globalLevelState === null) {
      window.globalLevelState = {
        time: 0,
        cache: this.game.cache.getJSON(`level:${this.level}`)
      };
    }

    this._loadLevel(window.globalLevelState.cache);
    // create UI score boards
    this._createHud();
  },

  update() {
    window.frameCounter++;
    this._handleCollisions();
    this._handleInput();
    // update scoreboards
    this.coinFont.text = `x${this.coinPickupCount}`;
    this.keyIcon.frame = keyCollected ? 1 : 0;
  },

  shutdown() {
    this.bgm.stop();
  },

  handleChat(data) {
    //console.log(data.keyCode);
    if(this.hero) {
      switch(data.keyCode) {
        case 8:
          this.textData = this.hero.playerText._text.substring(0, this.hero.playerText._text.length - 1);
          this.hero.talk(this.textData);
          break;
        // ignore arrow keys
        case 37:
        case 38:
        case 39:
        case 40:
          break;
        default:
          if ((this.hero.playerText._text.length + 1) <= this.maxTalkLength) {
            this.textData = this.hero.playerText._text;
            var char = String.fromCharCode(data.keyCode).toString();
            if (char.length > 0) {
              this.textData += char;
              this.hero.talk(this.textData);
            }
          }
          break;
      }
      window.sendKeyMessage({});
    }
  },

  _canHeroEnterDoor(hero) {
    return keyCollected && hero.body.touching.down;
  },

  _handleCollisions() {
    for (let i = 0; i < 2; i++) { // prevent collisions for pushing thru
      this.game.physics.arcade.collide(this.hero, this.platforms);
      //this.game.physics.arcade.collide(this.spiders, this.enemyWalls);
      this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
      this.game.physics.arcade.collide(this.spiders, this.platforms);
      this.game.physics.arcade.collide(this.hero, this.turnips);
      this.game.physics.arcade.collide(this.turnips, this.platforms);
      for (const uuid of window.globalOtherHeros.keys()) {
        const otherplayer = window.globalOtherHeros.get(uuid);
        this.game.physics.arcade.collide(otherplayer, this.spiders, null, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.spiders, this._onHeroVsEnemy, null, this);
        this.game.physics.arcade.collide(otherplayer, this.platforms, null, null, this);
        this.game.physics.arcade.collide(otherplayer, this.turnips, null, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.coins, this._onHeroVsCoin, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.key, this._onHeroVsKey, null, this);
        this.game.physics.arcade.overlap(otherplayer, this.door, this._onOtherHeroVsDoor, this._canHeroEnterDoor, this);
      }
      // hero vs coins (pick up)
      this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
      // hero vs key (pick up)
      this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this);
      // hero vs door (end level)
      this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor, this._canHeroEnterDoor, this);
      // ignore if there is no key or the player is on air
    }
  },

  _handleInput() {
    handleKeyMessages();

    //  logCurrentState(this.game);
    if (this.hero) { // Added this so we can control spawning of heros
      // Mobile Controls
        if(this.game.input.pointer1.x < 399 && (this.game.input.pointer1.y > 400) && this.game.input.pointer1.isDown)
        {
          console.log("isDown")
          if (leftSideVar === true){
            leftSideVar = false
            window.sendKeyMessage({ left: 'down' });
            console.log("leftDown")
          }
        }
        if(this.game.input.pointer1.isUp && leftSideVar === false)
        {
          leftSideVar = true;
          window.sendKeyMessage({ left: 'up' });
          console.log("leftUp")
        }
        if(this.game.input.pointer1.x > 400 && (this.game.input.pointer1.y > 400) && this.game.input.pointer1.isDown)
        {
          if (rightSideVar === true){
            rightSideVar = false
            window.sendKeyMessage({ right: 'down' });
            console.log("rightDown")
          }
        }
        if(this.game.input.pointer1.isUp && rightSideVar === false)
        {
          rightSideVar = true;
          window.sendKeyMessage({ right: 'up' });
          console.log("rightUp")
        }
        if((this.game.input.activePointer.y < 401) && this.game.input.activePointer.isDown)
        {
          if (this.hero.body.touching.down) {
            console.log("jump")
            if(jumpVar === true){
              jumpVar = false;
              window.sendKeyMessage({ up: 'down' });
              window.globalMyHero.jump();
            }
          }
        }
        //if(this.game.input.activePointer.isUp && jumpVar === false)
        //{
        //  jumpVar = true;
       //   window.sendKeyMessage({ up: 'up' });
       // }
      ///
      if (this.keys.left.isDown) {
        if (!keyStates.leftIsDown) {
          // console.log('left pushed');
          window.sendKeyMessage({ left: 'down' });
        }
        keyStates.leftIsDown = true;
      } else {
        if (keyStates.leftIsDown) {
          // console.log('left un-pushed');
          window.sendKeyMessage({ left: 'up' });
        }
        keyStates.leftIsDown = false;
      }

      if (this.keys.right.isDown) {
        if (!keyStates.rightIsDown) {
          // console.log('right pushed');
          window.sendKeyMessage({ right: 'down' });
        }
        keyStates.rightIsDown = true;
      } else {
        if (keyStates.rightIsDown) {
          // console.log('right un-pushed');
          window.sendKeyMessage({ right: 'up' });
        }
        keyStates.rightIsDown = false;
      }

      if (this.hero.body.touching.down) {
        if (this.keys.up.isDown) {
          if (!keyStates.upIsDown) {
            window.sendKeyMessage({ up: 'down' });
            window.globalMyHero.jump();
          }
          keyStates.upIsDown = true;
        } else {
          if (keyStates.upIsDown) {
            // console.log('up un-pushed');
            window.sendKeyMessage({ up: 'up' });
          }
          keyStates.upIsDown = false;
        }
      }

      if (this.keys.left.isDown || (this.game.input.activePointer.x < 399 && (this.game.input.activePointer.y > 400) && this.game.input.activePointer.isDown)) { // move hero left
        this.hero.move(-1);
      } else if (this.keys.right.isDown || ((this.game.input.activePointer.y > 400) && this.game.input.activePointer.isDown)) { // move hero right
        this.hero.move(1);
      } else { // stop
        this.hero.move(0);
      }

      // handle jump
      const JUMP_HOLD = 10;// 200; // ms
      if (this.keys.up.downDuration(JUMP_HOLD)) {
        let didJump = this.hero.jump();
        if (didJump) { this.sfx.jump.play();}
      }

      for (const uuid of window.globalOtherHeros.keys()) {
        const otherplayer = window.globalOtherHeros.get(uuid);
        if (Date.now() + JUMP_HOLD <= otherplayer.jumpStart) {
          // otherplayer.jump();
        }
        if (otherplayer.goingLeft) { // move hero left
          otherplayer.move(-1);
        } else if (otherplayer.goingRight) { // move hero right
          otherplayer.move(1);
        } else { // stop
          otherplayer.move(0);
        }
      }
    }

    if (window.globalWasHeroMoving && this.hero.body.velocity.x === 0 && this.hero.body.velocity.y === 0 && this.hero.body.touching.down) {
      window.sendKeyMessage({ stopped: 'not moving' });
      // console.log('stopped');
      window.globalWasHeroMoving = false;
    } else if (window.globalWasHeroMoving || this.hero.body.velocity.x !== 0 || this.hero.body.velocity.y !== 0 || !this.hero.body.touching.down) {
      window.globalWasHeroMoving = true;
    }
  },

  _onHeroVsEnemy(hero, enemy) {
    if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
      hero.bounce();
      this.sfx.stomp.play();
      enemy.die();
      logCurrentStateSpider(this.game, enemy);
    }
    else { // game over -> restart the game
      this.sfx.stomp.play();
      hero.die();
    }
  },

  _onHeroVsKey(hero, key) {
    this.sfx.key.play();
    this.door.frame = 1;
    key.kill();
    keyCollected = true;
    window.sendKeyMessage({ keyCollected });
  },

  _onHeroVsCoin(hero, coin) {
    this.sfx.coin.play();
    coin.kill();
    logCurrentStateCoin(this.game, coin);
    this.coinPickupCount++;
  },

  _onHeroVsDoor(hero, door) {
      // 'open' the door by changing its graphic and playing a sfx
    door.frame = 1;
      this.sfx.door.play();
      // play 'enter door' animation and change to the next level when it ends
    hero.freeze();
    this.game.add.tween(hero)
      .to({ x: this.door.x, alpha: 0 }, 0, null, true)
      .onComplete.addOnce(this._goToNextLevel, this);
  },

  _onOtherHeroVsDoor(hero, door) {
    // 'open' the door by changing its graphic and playing a sfx
    door.frame = 1;
    this.sfx.door.play();
    // play 'enter door' animation and change to the next level when it ends
    hero.freeze();
    this.game.add.tween(hero)
      .to({ x: this.door.x, alpha: 0 }, 500, null, true);
  },

  _goToNextLevel() {
    this.camera.fade('#000000');
    this.camera.onFadeComplete.addOnce(function () {
      window.globalUnsubscribe();
      window.updateOccupancyCounter = false;
      if (this.level === 2) {
        window.createMyPubNub(0);
      } else {
        window.createMyPubNub(this.level + 1);
      }
    }, this);
  },

  _loadLevel(data) {
    // console.log(data)
    // create all the groups/layers that we need
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.spiders = this.game.add.group();
    this.turnips = this.game.add.group();
    this.coins = this.game.add.group();

    this.bgm.play();
    this.bgm.volume += 2;
    // spawn hero and enemies
    this._spawnCharacters({ hero: data.hero, spiders: data.spiders });

    // spawn level decoration
    data.decoration.forEach(function (deco) {
      this.bgDecoration.add(
        this.game.add.image(deco.x, deco.y, 'decoration', deco.frame));
    }, this);

    // spawn platforms
    data.platforms.forEach(this._spawnPlatform, this);

    // spawn turnips
    data.turnips.forEach(this._spawnTurnip, this);

    // spawn important objects
    data.coins.forEach(this._spawnCoin, this);
    this._spawnKey(data.key.x, data.key.y);
    this._spawnDoor(data.door.x, data.door.y);

    // enable gravity
    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;
  },

  _addOtherCharacter(uuid) {
    // console.log('Added another character to game');
    if (window.globalOtherHeros.has(uuid)) { return; }
    this.hero2 = new window.Hero(this.game);
    this.hero2.lastKeyFrame = 0;
    this.game.add.existing(this.hero2);
    window.globalOtherHeros.set(uuid, this.hero2);
  },

  _removeOtherCharacter(uuid) {
    if (!window.globalOtherHeros.has(uuid)) { return; }
    window.globalOtherHeros.get(uuid).destroy();
    window.globalOtherHeros.delete(uuid);
  },

  _spawnCharacters(data) {
    var prevHero = window.globalMyHero ? window.globalMyHero : this.hero;
    this.hero = new window.Hero(this.game, prevHero);
    this.hero.body.bounce.setTo(0);

    window.globalMyHero = this.hero;
    window.globalOtherHeros = this.otherHeros = new Map();
    this.game.add.existing(this.hero);
    // globalMyHero.alpha = 1; //compensating for lag
    // spawn spiders
    data.spiders.forEach(function (spider) {
        let sprite = new window.Spider(this.game, spider.x, spider.y, spider.id);
        this.spiders.add(sprite);
    }, this);

    window.sendKeyMessage({});
  },

  _spawnPlatform(platform) {
    const sprite = this.platforms.create(platform.x, platform.y, platform.image);
    // physics for platform sprites
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    // console.log("dank", sprite.body.overlapY)
  },

  _spawnTurnip(turnip) {
    const sprite = this.turnips.create(turnip.x, turnip.y, turnip.image);
    // physics for turnip sprites
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    sprite.body.collideWorldBounds = true;
    sprite.speed = 100;
    sprite.body.velocity.x = sprite.speed;
    sprite.update = function() {
      // check against walls and reverse direction if necessary
      if (this.body.touching.right || this.body.blocked.right) {
          this.body.velocity.x = -this.speed; // turn left
      }
      else if (this.body.touching.left || this.body.blocked.left) {
          this.body.velocity.x = this.speed; // turn right
      }
    }
    // console.log("dank", sprite.body.overlapY)
  },

  _spawnCoin(coin) {
    const sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);
    // physics (so we can detect overlap with the hero)
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    // animations
    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
  },

  _spawnKey(x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    // enable physics to detect collisions, so the hero can pick the key up
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;
    // add a small 'up & down' animation via a tween
    this.key.y -= 3;
    this.game.add.tween(this.key)
      .to({ y: this.key.y + 6 }, 800, window.Phaser.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .loop()
      .start();
  },

  _spawnDoor(x, y) {
    this.door = this.bgDecoration.create(x, y, 'door');
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
  },

  _createHud() {
    const NUMBERS_STR = '0123456789X ';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    const coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');
    const coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
    this.hud.position.set(10, 10);
  }
};
