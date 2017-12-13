// Canvas, view area, and phaser resizer
const resizer = () => {

    mwVal = $('#view-area').css('width');
    mhVal = $('#view-area').css('height');

    const resizerTargetList = [
      '#phaser-target > canvas',
      '#how-to-play'
    ];
    resizerTargetList.forEach((target) => {
      $(target).css('width', mwVal);
      $(target).css('height', mhVal);

      //game.ScaleManager.RESIZE();
    });
}

const viewportCheck = () => {
  if($(document).width() <=800){
    $('#mobile-controls').css('display', 'flex');
  } else {
    $('#mobile-controls').css('display', 'none');
  }
};

// Keybindings for mobile controls, in the event that they are displayed.
const screenControls = $('#mobile-controls');

const upArrow    = $('#up');
const dnArrow    = $('#dn');
const redEnergy  = $('#red');
const bluEnergy  = $('#blue');

$('#up').click(() => {
  console.log("up arrow clicked");
});
$('#dn').click(() => {
  console.log("down arrow clicked");
});
$('#red').click(() => {
  console.log("red button clicked");
});
$('#blue').click(() => {
  console.log("blue button clicked");
});

var gliderVelocity = 100;
var mainState = {
    preload: function() {
        // This function will be executed at the beginning
        // That's where we load the images and sounds

    game.load.image('floor'    , 'assets/transparent_bar.png');
    game.load.image('roof'     , 'assets/transparent_bar.png');
    game.load.image('energyHub', 'assets/spritesheets/energyhub.png');
    game.load.image('sky'      , "assets/spritesheets/straight_hall.png");

    game.load.spritesheet('glider'        , 'assets/spritesheets/bass_drop_ship_cores_static.png', 220, 124);
    game.load.spritesheet('metrostrobe'   , 'assets/spritesheets/metrostrobe_sprites.png', 19, 19);
    game.load.spritesheet('energyHub_red' , 'assets/spritesheets/energyhub_red_sprite.png', 512, 512);
    game.load.spritesheet('energyHub_blue', 'assets/spritesheets/energyhub_blue_sprite.png', 512, 512);


    },

    create: function() {
        this.interval = 0,
        gliderPhase = 'null';
        // This function is called after the preload function
        // Here we set up the game, display sprites, etc.

        var hallAltitude = 282;
        var corePolarity = 'red';

        // Set the physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        sky = game.add.tileSprite(0,0,5480,548,'sky');

        //Needed later for controls
        this.shipAgility = 50;
        glider = this.game.add.sprite(100, 250,'glider');
        glider.frame = 2;
        glider.scale.setTo(0.5, 0.5);

        game.physics.arcade.enable(glider);
        this.relX = (glider.body.position.x) + 34;
        this.relY = (glider.body.position.y) + 32;

        metrostrobe = this.game.add.sprite(this.relX, this.relY, 'metrostrobe');
        metrostrobe.frame = 0;
        metrostrobe.scale.setTo(1.0, 1.0);
        metrostrobe.animations.add('pulse', [0, 1, 2, 3], 24, true);


        metrostrobe.animations.play('pulse');
        game.physics.arcade.enable(metrostrobe);


        this.roof = game.add.sprite(100, 70, 'roof');
        this.floor = game.add.sprite(100, 385, 'floor');

          // energyHub group
          this.energyHubsRed = game.add.group();
          this.energyHubsBlue = game.add.group();

          // ensure that all energyHubs have physics
          this.energyHubsRed.enableBody = true;
          this.energyHubsBlue.enableBody = true;

          this.energyHubsRed.physicsBodyType = Phaser.Physics.ARCADE;
          this.energyHubsBlue.physicsBodyType = Phaser.Physics.ARCADE;

          this.energyHubsRed.checkWorldBounds = true;
          this.energyHubsBlue.outOfBoundsKill = true;

          this.energyHubsRed.checkWorldBounds = true;
          this.energyHubsBlue.outOfBoundsKill = true;

          this.energyHubsRed.setAll('velocity.x', '(this.speedMultiplier * -1) + -200');
          this.energyHubsBlue.setAll('velocity.x', '(this.speedMultiplier * -1) + -200');

          //Increases the movement of energy hubs later into the game to increase challenge.
          this.speedMultiplier = 1;

        game.physics.arcade.enable(this.roof);
        game.physics.arcade.enable(this.floor);

        this.floor.body.immovable = true;
        this.floor.body.allowGravity = true;

        this.roof.body.immovable = true;
        this.roof.body.allowGravity = true;

        // Add gravity to the glider to make it slowly fall, and to metrostrobe so it can follow ship
        glider.body.gravity.y = 50;
        metrostrobe.body.gravity.y = 50;


        // Keyboard control binding
        var W = game.input.keyboard.addKey(Phaser.Keyboard.W);
        var A = game.input.keyboard.addKey(Phaser.Keyboard.A);
        var S = game.input.keyboard.addKey(Phaser.Keyboard.S);
        var D = game.input.keyboard.addKey(Phaser.Keyboard.D);

        // Up and Down events
        W.onDown.add(this.lift, this);
        A.onDown.add(this.redShift, this);
        S.onDown.add(this.dive, this);
        D.onDown.add(this.blueShift, this);

        D.onUp.add(this.stopShift, this);
        A.onUp.add(this.stopShift, this);

        // Touchscreen control events
        upArrow.click(() => {   // SAME EFFECT AS W KEY
          this.lift();
        });
        redEnergy.mousedown(() => { // SAME EFFECT AS A KEY
          this.redShift();
        });
        dnArrow.click(() => {   // SAME EFFECT AS S KEY
          this.dive();
        });
        bluEnergy.mousedown(() => { // SAME EFFECT AS D KEY
          this.blueShift();
        });

        bluEnergy.mouseup(() => {
          this.stopShift();
        });
        redEnergy.mouseup(() => {
          this.stopShift();
        });

        //UI Info
        this.score = 0;
        this.energy = 200;
        this.ui = ("energy: " + this.energy + "\n" + "Score: " + this.score);
        this.uiInfo = game.add.text(20, 10, this.ui, { font: "18px Dosis", fill: "#ffffff" });

        //Spawns an energy hub based on the downbeat of BGM.
        // TODO: implement a variable that scales timer interval to BPM of song.
        this.Spawner = game.time.events.loop(2000, this.spawnEnergyHub, this);
        this.scoreTicker = game.time.events.loop(1200, this.increaseScore, this);

        //causes player to lose energy at twice the rate that cores spawn so that they need to attempt to collect all.
        this.energyBurn = game.time.events.loop(150, this.decreaseenergy, this);

        //Transient logic switches
        this.scoreIncreased = false;
        this.speedIncreased = false;
    },

    update: function() {
        // This function is called 60 times per second
        resizer();
        viewportCheck();
        // this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.game.scale.setShowAll();
        // window.addEventListener(
        //   'resize', function () {
        //     this.game.scale.refresh();
        //   });
        //     this.game.scale.refresh();

        //Keeps the UI data refreshed and logs top score
        this.ui = ("Energy: " + this.energy + "\n" + "Score: " + this.score);

sky.tilePosition.x -= 5;


var roofCollision = this.game.physics.arcade.collide(glider, this.roof, this.playerHit, null, this);
var floorCollision = this.game.physics.arcade.collide(glider, this.floor);

var energyHubRedCollision = this.game.physics.arcade.overlap(metrostrobe, this.energyHubsRed, this.playerHit, null, this);
var energyHubBlueCollision = this.game.physics.arcade.overlap(metrostrobe, this.energyHubsBlue, this.playerHit, null, this);



// TODO: write the game logic based off of these two conditions.
if(energyHubRedCollision) {
  // console.log(">>>>>> RED ENERGY HUB DETECTED <<<<<<");
    if (gliderPhase === 'red') {
      // console.log("Matched with core.");
      //Increases energy with each downbeat match and does the thing.
      this.increaseenergy();
    }
    else if (gliderPhase === 'blue') {
      // console.log("Core Dissonance.");
      //Decreases energy with each downbeat dissonance and does the thing.
      this.decreaseenergy();
    }
    else if (gliderPhase === 'null') {
      // console.log("Energy Hub Missed.");
      //Doesn't affect energy, but can still do the thing.
    }
}
if(energyHubBlueCollision) {
  // console.log(">>>>>> BLUE ENERGY HUB DETECTED <<<<<<");
    if (gliderPhase === 'blue') {
      // console.log("Matched with core.");
      //Increases energy with each downbeat match and does the thing.
      this.increaseenergy();
    }
    else if (gliderPhase === 'red') {
      // console.log("Core Dissonance.");
      //Decreases energy with each downbeat dissonance and does the thing.
      this.decreaseenergy();
    }
    else if (gliderPhase === 'null') {
      // console.log("Energy Hub Missed.");
      //Doesn't affect energy, but can still do the thing.
    }
}
//Checks to make sure the ship doesn't crash or run out of energy.

if (roofCollision) {
  console.log('crashed to roof');
  this.restartGame();
}
if (floorCollision) {
  console.log('crashed to floor');
  this.restartGame();
}
if (this.energy < 5) {
      if (this.energy === 0) {
    console.log('No more energy...!');
    this.shipAgility = 0;
    }
    else {
      this.shipAgility = 50;
    }
}
// Increases speed multiplier and ship agility the higher the score gets.
if (this.score !== 0 && this.score % 50 === 0) {
  if (this.speedIncreased === false) {
  this.speedMultiplier += 5;
  console.log('accelerating');
  this.speedIncreased = true;
}
else {
  this.speedIncreased = false;
}
}
// TODO: Work on Main game logic ^^^


    },

    increaseScore: function() {
      this.score += 1;
      this.uiInfo.text = this.ui;
    },
    decreaseScore: function() {
      this.score -= 1;
      this.uiInfo.text = this.ui;
    },
    increaseenergy: function() {
      this.energy += 1;
      this.uiInfo.text = this.ui;
    },
    decreaseenergy: function() {
      if (this.energy === 0) {
        this.energy = 0;
      }
      else {
      this.energy -= 1;
      this.uiInfo.text = this.ui;
    }
    },

spawnEnergyHub: function() {
  //Supposed to spawn either a red or blue hub based on whether or not interval number is even or odd.
  //spawns red energyHubs at 1/4 and 3/4 of each Measure
  if (this.interval % 2 === 0) {
    var randomY = Math.floor(Math.random() * 100) + 200;
    energyHubRedSprite = this.game.add.sprite(1000, randomY, 'energyHub_red')
    energyHubRedSprite.frame = 0;
    energyHubRedSprite.scale.setTo(0.1, 0.1);

    this.energyHubsRed.add(energyHubRedSprite);
    energyHubRedSprite.body.velocity.x = (this.speedMultiplier * -1) + -200;
    energyHubRedSprite.body.rotation -= 5;
    energyHubRedSprite.animations.add('rotate_red', [0, 1, 2], 10, true);
    energyHubRedSprite.animations.play('rotate_red');
  }
  //spawns blue energyHubs at 2/4 and 4/4 of each Measure
  else if(this.interval % 2 !== 0){
    var randomY = Math.floor(Math.random() * 105) + 220;
    energyHubBlueSprite = this.game.add.sprite(1000, randomY, 'energyHub_blue')
    energyHubBlueSprite.frame = 0;
    energyHubBlueSprite.scale.setTo(0.1, 0.1);

    this.energyHubsBlue.add(energyHubBlueSprite);
    energyHubBlueSprite.body.velocity.x = (this.speedMultiplier * -1) + -200;
    energyHubBlueSprite.body.rotation -= 5;
    energyHubBlueSprite.animations.add('rotate_blue', [0, 1, 2], 10, true);
    energyHubBlueSprite.animations.play('rotate_blue');
  }
  this.interval++;
},


// All the Ship Controls
// shipAgility: 50,
lift: function() {
    // Add a vertical velocity to the bird
    glider.body.velocity.y -= this.shipAgility;
    metrostrobe.body.velocity.y -= this.shipAgility;
},

dive: function() {
    // Add a vertical velocity to the bird
    glider.body.velocity.y += this.shipAgility;
    metrostrobe.body.velocity.y += this.shipAgility;
},

redShift: function() {
    // Add a vertical velocity to the bird
    gliderPhase = 'red';
    currentPhaseImg = 'redPhase';
    console.log(gliderPhase + ' Shifted');
    glider.frame = 1;
},

blueShift: function() {
    // Add a vertical velocity to the bird
    gliderPhase = 'blue';
    currentPhaseImg = 'bluePhase';
    console.log(gliderPhase + ' Shifted');
    glider.frame = 0;
},

stopShift: function() {
    // Add a vertical velocity to the bird
    gliderPhase = 'null';
    glider.frame = 2;
},



// Restart the game
restartGame: function() {
    // Start the 'main' state, which restarts the game

    game.state.start('main');

},
};

// Initialize Phaser
var game = new Phaser.Game(1020, 523, Phaser.CANVAS, 'phaser-target', '', true);

// Add the different game states
game.state.add('main', mainState);

// Start the state to actually start the game
// game.state.start('main');
