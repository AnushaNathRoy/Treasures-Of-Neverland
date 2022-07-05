// import
import "./style.css";

import * as THREE from "three";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// constant
var WIDTH = window.innerWidth,
  HEIGHT = window.innerHeight,
  ASPECT = WIDTH / HEIGHT,
  UNITSIZE = 250,
  WALLHEIGHT = UNITSIZE / 3,
  MOVESPEED = 100,
  LOOKSPEED = 0.075,
  BULLETMOVESPEED = MOVESPEED * 5,
  NUMAI = 5,
  PROJECTILEDAMAGE = 20;

let boat;
let isanim = true;
// variables
let camera, scene, renderer;
let controls, water, sun;
let score = 0;
let BScore = 0;
let DScore = 0;
let GameLost = false;
let GameWon = false;
let health = 1000;
let kills = 0;
let isBirdView = false;
let isShipView = false;
let isLost = false;
let isWin = false;
const loader = new GLTFLoader();

$(document).ready(function () {
  $("body").append('<div id="intro"></div>');
  $("#intro")
    .css({ width: WIDTH, height: HEIGHT })
    .one("click", function (e) {
      e.preventDefault();
      $(this).fadeOut();
      $("#app").fadeIn();
      init();
      // setInterval(drawRadar, 1000);
      animate();
    });
});

$(".close").click(function () {
  $(this).parent(".alert").fadeOut();
  isanim = !isanim;
});

// utility functions
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//class Hero Boat
class Boat {
  constructor() {
    loader.load("assets/hero_ship/scene.gltf", (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(15, 15, 15);
      gltf.scene.position.set(-2, 9, 50);
      gltf.scene.rotation.set(0, 2.95, 0);

      this.boat = gltf.scene;
      this.speed = {
        velocity: -0.01,
        rotation: 0,
      };
    });
  }

  updateBoat() {
    if (this.boat) {
      this.boat.rotation.y += this.speed.rotation;
      this.boat.translateZ(this.speed.velocity);
    }
  }

  stopBoat() {
    if (this.boat) {
      this.speed.velocity = 0;
      this.speed.rotation = 0;
    }
  }
}

async function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      resolve(gltf.scene);
    });
  });
}

class pirates {
  constructor(_scene) {
    scene.add(_scene);
    _scene.scale.set(3, 3, 3);
    _scene.position.set(randomInt(-1000, 1000), -2, randomInt(-1000, 1000));
    _scene.rotation.set(0, boat.boat.rotation.y, 0);
    // gltf.scene.rotation.set(0, 2.95, 0);
    this.pirate = _scene;
    this.speed = {
      velocity: 0.1,
      rotation: 0,
    };
  }

  updateBoat() {
    if (this.pirate) {
      this.pirate.lookAt(boat.boat.position.x, -2, boat.boat.position.z);
      this.pirate.translateZ(this.speed.velocity);
    }
  }
}

class bronzeChest {
  constructor(_scene) {
    scene.add(_scene);
    _scene.scale.set(5, 5, 5);
    _scene.position.set(randomInt(-1000, 1000), -2, randomInt(-1000, 1000));
    // gltf.scene.rotation.set(0, 2.95, 0);
    this.chest = _scene;
  }
}

class diamondChest {
  constructor(_scene) {
    scene.add(_scene);
    _scene.scale.set(5, 5, 5);
    _scene.position.set(randomInt(-200, 200), 1, randomInt(-200, 200));
    // gltf.scene.rotation.set(0, 2.95, 0);
    this.chest = _scene;
  }
}

class cannon {
  constructor(_scene, _position) {
    scene.add(_scene);
    _scene.scale.set(0.05, 0.05, 0.05);
    _scene.position.set(_position.x, 2, _position.z);
    // gltf.scene.rotation.set(0, 2.95, 0);

    this.cannon = _scene;
    this.speed = {
      velocity: 1,
      rotation: 0,
    };
  }

  startCannon() {
    if (this.cannon) {
      this.cannon.lookAt(boat.boat.position.x, 2, boat.boat.position.z);
      this.cannon.translateZ(this.speed.velocity);
    }
  }

  startHeroCannon() {
    if (this.cannon) {
      this.cannon.rotation.y = boat.boat.rotation.y;
      this.cannon.translateZ(this.speed.velocity);
    }
  }

  updateCannon() {
    if (this.cannon) {
      this.cannon.translateZ(this.speed.velocity);
    }
  }
}

let boatModel = null;
let boatModel1 = null;
let boatModel2 = null;
let boatModel3 = null;

async function createBronzeChest() {
  if (!boatModel) {
    boatModel = await loadModel("assets/bronze/scene.gltf");
  }
  return new bronzeChest(boatModel.clone());
}

let BChest = [];
let BChestCollected = [];
const BChestCount = 10;

async function createDiamondChest() {
  if (!boatModel1) {
    boatModel1 = await loadModel("assets/diamond/scene.gltf");
  }
  return new diamondChest(boatModel1.clone());
}

let DChest = [];
let DChestCollected = [];
const DChestCount = 10;

async function createPirates() {
  if (!boatModel2) {
    boatModel2 = await loadModel("assets/ghost_ship/scene.gltf");
  }
  return new pirates(boatModel2.clone());
}

async function createCannon(position) {
  if (!boatModel3) {
    boatModel3 = await loadModel("assets/cannon/scene.gltf");
  }
  return new cannon(boatModel3.clone(), position);
}

async function shootHeroCanon() {
  if (boat.boat) {
    const cannon = await createCannon(boat.boat.position);
    cannon.startHeroCannon();
    HeroCannons.push(cannon);
  }
}

let Pirates = [];
let PiratesDead = [];
let PiratesCount = 5;

async function init() {
  boat = new Boat();
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);
  //

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    1,
    20000
  );
  camera.position.set(200, 200, 200);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  sun = new THREE.Vector3();

  // Water

  const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

  water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "assets/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }
    ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined,
  });

  water.rotation.x = -Math.PI / 2;

  scene.add(water);

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;

  skyUniforms["turbidity"].value = 10;
  skyUniforms["rayleigh"].value = 2;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const parameters = {
    elevation: 40,
    azimuth: 80,
  };

  const pmremGenerator = new THREE.PMREMGenerator(renderer);

  function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    scene.environment = pmremGenerator.fromScene(sky).texture;
  }

  updateSun();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set(0, 10, 0);
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  const waterUniforms = water.material.uniforms;

  for (let i = 0; i < BChestCount; i++) {
    const chest1 = await createBronzeChest();
    const chest2 = await createDiamondChest();
    BChest.push(chest1);
    DChest.push(chest2);
    BChestCollected.push(false);
    DChestCollected.push(false);
  }

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", function (e) {
    if (e.key === "w") {
      boat.speed.velocity = 0.2;
    }

    if (e.key === "s") {
      boat.speed.velocity = -0.2;
    }

    if (e.key === "a") {
      boat.speed.rotation = 0.2;
    }

    if (e.key === "d") {
      boat.speed.rotation = -0.2;
    }

    if (e.key === "x") {
      shootHeroCanon();
    }

    if (e.key === " ") {
      isanim = !isanim;
    }

    if(e.key === "i"){
      isanim = !isanim;
      $("#info").css("display", "block");
    }
    if (e.key === "v") {
      if (isBirdView) {
        isBirdView = false;
        isShipView = true;
      } else {
        isBirdView = true;
        isShipView = false;
      }
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.key === "w" || e.key === "s" || e.key === "a" || e.key === "d") {
      boat.stopBoat();
    }
  });

  for (let j = 0; j < PiratesCount; j++) {
    const pirate = await createPirates();
    Pirates.push(pirate);
    PiratesDead.push(false);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function isCollision(obj1, obj2) {
  return (
    Math.abs(obj1.position.x - obj2.position.x) < 15 &&
    Math.abs(obj1.position.z - obj2.position.z) < 15
  );
}

function checkCollisions() {
  if (boat.boat) {
    BChest.forEach((chest) => {
      if (chest.chest) {
        if (isCollision(boat.boat, chest.chest)) {
          scene.remove(chest.chest);
          BChestCollected[BChest.indexOf(chest)] = true;
        }
      }
    });
    DChest.forEach((chest) => {
      if (chest.chest) {
        if (isCollision(boat.boat, chest.chest)) {
          scene.remove(chest.chest);
          DChestCollected[DChest.indexOf(chest)] = true;
        }
      }
    });

    HeroCannons.forEach((cannon) => {
      if (cannon.cannon) {
        Pirates.forEach((pirate) => {
          if (pirate.pirate) {
            if (isCollision(cannon.cannon, pirate.pirate)) {
              scene.remove(pirate.pirate);
              scene.remove(cannon.cannon);
              PiratesDead[Pirates.indexOf(pirate)] = true;
            }
          }
        });
      }
    });

    Cannons.forEach((cannon) => {
      if (cannon.cannon) {
        if (boat.boat) {
          if (isCollision(cannon.cannon, boat.boat)) {
            scene.remove(cannon.cannon);
            health -= 1;
          }
        }
      }
    });

    for(let i = 0; i < PiratesCount; i++){
      if(Pirates[i].pirate && (PiratesDead[i] === false)){
        if(isCollision(Pirates[i].pirate, boat.boat)){
          isLost = true;
        }
      }
    }
  }

  score = 0;
  BScore = 0;
  DScore = 0;
  kills = 0;

  for (let i = 0; i < BChestCount; i++) {
    if (BChestCollected[i]) {
      BScore += 1;
    }
  }
  for (let i = 0; i < DChestCount; i++) {
    if (DChestCollected[i]) {
      DScore += 1;
    }
  }
  for (let i = 0; i < PiratesCount; i++) {
    if (PiratesDead[i]) {
      kills += 1;
    }
  }

  if (DScore === DChestCount){
    isWin = true;
  }
  document.getElementById("scoreB").innerHTML = BScore;
  document.getElementById("scoreD").innerHTML = DScore;
  document.getElementById("score").innerHTML = 5 * BScore + 10 * DScore + kills * 20;
}

let Cannons = [];
let HeroCannons = [];

function removeCanon() {
  var removedCanonBall = Cannons.shift();
  scene.remove(removedCanonBall);
}

async function shootCanon() {
  if (Pirates.length > 0) {
    let random1 = Math.floor(Math.random() * Pirates.length);

    if (!PiratesDead[random1]) {
      const cannon = await createCannon(Pirates[random1].pirate.position);
      cannon.startCannon();
      Cannons.push(cannon);
    }
  }
}

function checkWinLost() {
  if (isLost) {
    isanim = false;
    $("#lost").css("display", "block");
    $("#lost").css("z-index", "1");
  }
  if (isWin) {
    isanim = false;
    $("#win").css("display", "block");
    $("#win").css("z-index", "1");
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (isanim) {
    render();
    boat.updateBoat();

    if (isBirdView) {
      camera.position.set(
        boat.boat.position.x - 150,
        200,
        boat.boat.position.z - 150
      );
    }

    if (isShipView) {
      camera.position.set(
        boat.boat.position.x - 50,
        boat.boat.position.y + 50,
        boat.boat.position.z - 50
      );
    }
    // camera.position.set(boat.boat.position.x-200,200,boat.boat.position.z-200);
    // camera.lookAt(boat.boat.position);
    for (let i = 0; i < PiratesCount; i++) {
      // print(Pirates[i].pirate);
      if (Pirates.length) {
        Pirates[i].updateBoat();
      }
    }

    var randomn = Math.floor(Math.random() * 1000);
    if (randomn < 10) {
      shootCanon();
    }

    for (let i = 0; i < Cannons.length; i++) {
      if (Cannons.length) {
        Cannons[i].updateCannon();
      }
    }

    for (let i = 0; i < HeroCannons.length; i++) {
      if (HeroCannons.length) {
        HeroCannons[i].updateCannon();
      }
    }

    checkCollisions();
    if(health <= 0){
      isLost = true;
    }
    checkWinLost();
  }
}

function render() {
  water.material.uniforms["time"].value += 1.0 / 60.0;
  renderer.render(scene, camera);
  camera.lookAt(boat.boat.position);
  document.getElementById("score").innerHTML = score;
  document.getElementById("scoreB").innerHTML = BScore;
  document.getElementById("scoreD").innerHTML = DScore;
  document.getElementById("health").innerHTML = health;
  document.getElementById("kills").innerHTML = kills;
}
