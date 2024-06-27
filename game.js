const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');


const groundY = canvas.height - 50;
const groundHeight = 50;
let groundSpeed = 2.4;
let groundX = 0;

let isJumping = false;
let canDoubleJump = false;
let jumpVelocityY = 0;
const gravity = 0.7;
let jumpStrength = 12;
let yPosition = groundY - 50;
let xPosition = 50;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let obstacles = [];
let collectibles = [];
let powerUps = [];
let platforms = [];
let obstacleSpeed = 2;
let isGameOver = false;
let gameSpeedIncrement = 0.002;

let isInvincible = false;
let powerUpTimers = {};


let isMovingLeft = false;
let isMovingRight = false;
let isOnPlatform = false;


const pikachuImage = new Image();
pikachuImage.src = './assets/pikachu.png'; 

const collectibleImage = new Image();
collectibleImage.src = './assets/coin.png'; 

const invincibilityImage = new Image();
invincibilityImage.src = './assets/invincibility.png'; 
const speedBoostImage = new Image();
speedBoostImage.src = './assets/speed_boost.png'; 
const higherJumpImage = new Image();
higherJumpImage.src = './assets/higher_jump.png'; 


const platformImages = {
    grass: new Image(),
    snow: new Image(),
    sand: new Image()
};
platformImages.grass.src = './assets/grass_platform.png'; 
platformImages.snow.src = './assets/snow_platform.png'; 
platformImages.sand.src = './assets/sand_platform.png'; 


const backgroundImages = [
    { src: './assets/forest.jpg', platformImage: platformImages.grass }, 
    { src: './assets/ice.jpg', platformImage: platformImages.snow }, 
    { src: './assets/desert.jpg', platformImage: platformImages.sand } 
];
let currentBackgroundIndex = 0;
const backgroundChangeInterval = 3 * 60 * 1000; 


backgroundImages.forEach(bg => {
    const img = new Image();
    img.src = bg.src;
    bg.image = img;
});


class Obstacle {
    constructor(x, y, width, height, imageSrc, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = imageSrc;
        this.type = type;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= obstacleSpeed;
        if (this.type === 'moving') {
            this.y += Math.sin(Date.now() / 100) * 2;
        } else if (this.type === 'resizing') {
            this.width += Math.sin(Date.now() / 100) * 2;
            this.height += Math.sin(Date.now() / 100) * 2;
        }
    }

    isOutOfScreen() {
        return this.x + this.width < 0;
    }

    isColliding(px, py, pw, ph) {
        return (
            px < this.x + this.width &&
            px + pw > this.x &&
            py < this.y + this.height &&
            py + ph > this.y
        );
    }
}

class Collectible {
    constructor(x, y, width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= obstacleSpeed;
    }

    isOutOfScreen() {
        return this.x + this.width < 0;
    }

    isColliding(px, py, pw, ph) {
        return (
            px < this.x + this.width &&
            px + pw > this.x &&
            py < this.y + this.height &&
            py + ph > this.y
        );
    }
}

class PowerUp {
    constructor(x, y, width, height, image, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = image;
        this.type = type;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    update() {
        this.x -= obstacleSpeed;
    }

    isOutOfScreen() {
        return this.x + this.width < 0;
    }

    isColliding(px, py, pw, ph) {
        return (
            px < this.x + this.width &&
            px + pw > this.x &&
            py < this.y + this.height &&
            py + ph > this.y
        );
    }
}

class Platform {
    constructor(x, y, width, height, image) {
        this.x = x;
        this.y = y;
        this.width = width+10;
        this.height = height+10;
        this.image = image;
        this.coins = [];
        this.spawnCoins();
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        this.coins.forEach((coin) => coin.draw());
    }

    update() {
        this.x -= groundSpeed;
        this.coins.forEach((coin) => coin.update());
    }

    isOutOfScreen() {
        return this.x + this.width < 0;
    }

    isColliding(px, py, pw, ph) {
        return (
            px < this.x + this.width &&
            px + pw > this.x &&
            py + ph > this.y &&
            py + ph < this.y + this.height
        );
    }

    spawnCoins() {
        if (Math.random() < 0.5) {
            const coinX = this.x + Math.random() * (this.width - 30);
            const coinY = this.y - 30;
            this.coins.push(new Collectible(coinX, coinY, 30, 30, collectibleImage));
        }
    }
}


function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, groundY, canvas.width, groundHeight);
}


function drawBackground() {
    const bg = backgroundImages[currentBackgroundIndex];
    ctx.drawImage(bg.image, 0, 0, canvas.width, groundY); 
    platforms.forEach((platform) => {
        platform.image = bg.platformImage; 
        platform.draw();
    });
}


function update() {
    if (isGameOver) return;

    
    if (isJumping) {
        yPosition -= jumpVelocityY;
        jumpVelocityY -= gravity;
        isOnPlatform = false;

        platforms.forEach((platform) => {
            if (platform.isColliding(xPosition, yPosition, 50, 50) && jumpVelocityY <= 0) {
                yPosition = platform.y - 50;
                isJumping = false;
                canDoubleJump = true;
                jumpVelocityY = 0;
                isOnPlatform = true;
            }
        });

        if (!isOnPlatform && yPosition >= groundY - 50) {
            yPosition = groundY - 50;
            isJumping = false;
            canDoubleJump = false;
            jumpVelocityY = 0;
        }
    } else {

        let onAnyPlatform = false;
        platforms.forEach((platform) => {
            if (platform.isColliding(xPosition, yPosition, 50, 50)) {
                yPosition = platform.y - 50;
                onAnyPlatform = true;
            }
        });
        if (!onAnyPlatform && yPosition < groundY - 50) {
            yPosition += groundSpeed;
        }
    }

    if (isMovingLeft) {
        xPosition -= groundSpeed;
    }

    if (isMovingRight) {
        xPosition += groundSpeed;
    }

   
    xPosition = Math.max(0, Math.min(canvas.width - 100, xPosition));

    
    obstacles.forEach((obstacle, index) => {
        obstacle.update();
        if (obstacle.isOutOfScreen()) {
            obstacles.splice(index, 1);
        }
        if (!isInvincible && obstacle.isColliding(xPosition, yPosition, 50, 50)) {
            isGameOver = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
        }
    });

    collectibles.forEach((collectible, index) => {
        collectible.update();
        if (collectible.isOutOfScreen()) {
            collectibles.splice(index, 1);
        }
        if (collectible.isColliding(xPosition, yPosition, 50, 50)) {
            collectibles.splice(index, 1);
            score += 10;
        }
    });

    powerUps.forEach((powerUp, index) => {
        powerUp.update();
        if (powerUp.isOutOfScreen()) {
            powerUps.splice(index, 1);
        }
        if (powerUp.isColliding(xPosition, yPosition, 50, 50)) {
            powerUps.splice(index, 1);
            applyPowerUp(powerUp.type);
        }
    });

    platforms.forEach((platform, index) => {
        platform.update();
        if (platform.isOutOfScreen()) {
            platforms.splice(index, 1);
        }
    });

    
    spawnObstacles();
    spawnCollectibles();
    spawnPowerUps();
    spawnPlatforms();

    groundX += groundSpeed;
    if (groundX >= groundHeight) {
        groundX = 0;
    }

    score++;
}


function applyPowerUp(type) {
    switch (type) {
        case 'invincibility':
            activatePowerUp('invincibility', 8000); 
            break;
        case 'speedBoost':
            activatePowerUp('speedBoost', 20000); 
            groundSpeed *= 1.5;
            break;
        case 'higherJump':
            activatePowerUp('higherJump', 20000); 
            jumpStrength *= 1.5;
            break;
    }
}

function activatePowerUp(type, duration) {
    if (powerUpTimers[type]) {
        clearTimeout(powerUpTimers[type]);
    }
    switch (type) {
        case 'invincibility':
            isInvincible = true;
            powerUpTimers[type] = setTimeout(() => {
                isInvincible = false;
            }, duration);
            break;
        case 'speedBoost':
            powerUpTimers[type] = setTimeout(() => {
                groundSpeed /= 1.5;
            }, duration);
            break;
        case 'higherJump':
            powerUpTimers[type] = setTimeout(() => {
                jumpStrength /= 1.5;
            }, duration);
            break;
    }
}


function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawGround();

    ctx.drawImage(pikachuImage, xPosition, yPosition, 50, 50);

    obstacles.forEach((obstacle) => {
        obstacle.draw();
    });

    collectibles.forEach((collectible) => {
        collectible.draw();
    });

    powerUps.forEach((powerUp) => {
        powerUp.draw();
    });

    platforms.forEach((platform) => {
        platform.draw();
    });

    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('High Score: ' + highScore, 10, 40);

    if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 75, canvas.height / 2 - 30);
        ctx.fillText('Score: ' + score, canvas.width / 2 - 75, canvas.height / 2);
        ctx.fillText('Press R to Restart', canvas.width / 2 - 115, canvas.height / 2 + 30);
    }
}


function spawnObstacles() {
    if (Math.random() < 0.01) { 
        const obstacleTypes = [
            { width: 20, height: 20, src: './assets/stone.png', type: 'static' },
            { width: 40, height: 40, src: './assets/spike.png', type: 'moving' },
            { width: 30, height: 30, src: './assets/trap.png', type: 'resizing' },
        ];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const gap = Math.random() * 300 + 200;
        if (obstacles.length === 0 || (canvas.width - obstacles[obstacles.length - 1].x > gap)) {
            obstacles.push(new Obstacle(canvas.width, groundY - type.height, type.width, type.height, type.src, type.type));
        }
    }
}


function spawnCollectibles() {
    if (Math.random() < 0.005) { 
        const gap = Math.random() * 400 + 200;
        if (collectibles.length === 0 || (canvas.width - collectibles[collectibles.length - 1].x > gap)) {
            collectibles.push(new Collectible(canvas.width, groundY - 60, 30, 30, collectibleImage));
        }
    }
}


function spawnPowerUps() {
    if (Math.random() < 0.001) { 
        const powerUpTypes = [
            { width: 30, height: 30, image: invincibilityImage, type: 'invincibility' },
            { width: 30, height: 30, image: speedBoostImage, type: 'speedBoost' },
            { width: 30, height: 30, image: higherJumpImage, type: 'higherJump' }
        ];
        const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        const gap = Math.random() * 600 + 400;
        if (powerUps.length === 0 || (canvas.width - powerUps[powerUps.length - 1].x > gap)) {
            powerUps.push(new PowerUp(canvas.width, groundY - 70, type.width, type.height, type.image, type.type));
        }
    }
}


function spawnPlatforms() {
    if (Math.random() < 0.01) { 
        const width = Math.random() * 100 + 50;
        const height = 20;
        const y = Math.random() * (groundY - 150) + 100; 
        const gap = Math.random() * 400 + 200;
        if (platforms.length === 0 || (canvas.width - platforms[platforms.length - 1].x > gap)) {
            platforms.push(new Platform(canvas.width, y, width, height, platformImages.grass)); 
        }
    }
}


function handleKeyDown(event) {
    if (isGameOver) {
        if (event.key === 'r' || event.key === 'R') {
            resetGame();
        }
        return;
    }

    if (event.key === ' ') {
        if (!isJumping) {
            isJumping = true;
            jumpVelocityY = jumpStrength;
        } else if (canDoubleJump) {
            jumpVelocityY = jumpStrength;
            canDoubleJump = false;
        }
    }

    if (event.key === 'ArrowLeft') {
        isMovingLeft = true;
    }

    if (event.key === 'ArrowRight') {
        isMovingRight = true;
    }
}


function handleKeyUp(event) {
    if (event.key === 'ArrowLeft') {
        isMovingLeft = false;
    }

    if (event.key === 'ArrowRight') {
        isMovingRight = false;
    }
}


function resetGame() {
    isGameOver = false;
    score = 0;
    obstacles = [];
    collectibles = [];
    powerUps = [];
    platforms = [];
    groundSpeed = 2;
    obstacleSpeed = 2;
    gameSpeedIncrement = 0.002;
    xPosition = 50;
    yPosition = groundY - 50;
    jumpVelocityY = 0;
    isInvincible = false;
    powerUpTimers = {};
    gameLoop();
}


function cycleBackground() {
    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundImages.length;
}


setInterval(cycleBackground, backgroundChangeInterval);

function gameLoop() {
    update();
    render();
    if (!isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

gameLoop();
