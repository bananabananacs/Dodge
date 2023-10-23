const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.position = "fixed";

CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
	if (width < 2 * radius) radius = width / 2;
	if (height < 2 * radius) radius = height / 2;
	this.beginPath();
	this.moveTo(x + radius, y);
	this.arcTo(x + width, y, x + width, y + height, radius);
	this.arcTo(x + width, y + height, x, y + height, radius);
	this.arcTo(x, y + height, x, y, radius);
	this.arcTo(x, y, x + width, y, radius);
	this.closePath();
	return this;
}

window.addEventListener("resize", function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

let UP, DOWN, LEFT, RIGHT;
let touching = false;
let touchX = 50;
let touchY = 50;
let stickX = 50;
let stickY = 50;
let dead = false;
let bads = [];
let score = 0;
let numBaddies = 0;

if (canvas.width < 720) {
	numBaddies = 4;
} else {
	numBaddies = 10;
}

class Good {
	constructor(x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.redSwitch = 1;
		this.red = 0;
	}

	draw() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		ctx.fillStyle = "pink";
		ctx.strokeStyle = "#e75480";
		ctx.stroke();
		ctx.fill();
		ctx.closePath();

		if (this.redSwitch == 0) {
			this.red += 1;
		}
		else {
			this.red -= 1;
		}

		if (this.red > 10) {
			this.redSwitch = 1;
		}

		if (this.red < -10) {
			this.redSwitch = 0;
		}

		this.r += this.red / 50;
	}

	newPos() {
		this.x = getRandomNumber(0, canvas.clientWidth);
		this.y = getRandomNumber(0, canvas.clientHeight);
	}
}

class Player {
	constructor(x, y, r) {
		this.x = x;
		this.y = y;
		this.xv = 0;
		this.yv = 0;
		this.accX = 0;
		this.accY = 0;
		if (canvas.width < 720) {
			this.speed = 1.5;
		} else {
			this.speed = 4;
		}
		this.r = r;
	}

	draw() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		ctx.fillStyle = "#001285";
		ctx.strokeStyle = "#000C66";
		ctx.lineWidth = 7;
		ctx.stroke();
		ctx.fill();
		ctx.closePath();
	}

	move() {
		if (UP) {
			this.accY = -this.speed;
		}

		if (DOWN) {
			this.accY = this.speed;
		}

		if (LEFT) {
			this.accX = -this.speed;
		}

		if (RIGHT) {
			this.accX = this.speed;
		}

		if ((UP || DOWN) && (RIGHT || LEFT)) {
			this.accX = this.accX / 1.5;
			this.accY = this.accY / 1.5;
		}

		if (!UP && !DOWN) {
			this.accY = 0;
		}

		if (!RIGHT && !LEFT) {
			this.accX = 0;
		}

		if (goodColl(good, this)) {
			good.newPos();
			score += 1;
			for (let i = 0; i < bads.length; i++) {
				bads[i].speedMulto -= .25;
			}
		}

		for (let i = 0; i < bads.length; i++) {
			if (goodColl(bads[i], this)) {
				gameOver();
			}
		}

		this.xv += this.accX;
		this.yv += this.accY;
		this.xv *= 0.8;
		this.yv *= 0.8;
		this.x += this.xv;
		this.y += this.yv;
	}
}

class Bad {
	constructor(x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.speed = 1;
		this.startXv = (Math.random() * 5 + 5) * (Math.floor(Math.random() * 2) || -1);
		this.startYv = (Math.random() * 5 + 5) * (Math.floor(Math.random() * 2) || -1);
		this.xv = this.startXv;
		this.yv = this.startYv;
		this.speedMulto = 4;
		bads.push(this);
		this.startCol();
	}

	startCol() {
		for (let i = 0; i < bads.length; i++) {
			if (goodColl(this, bads[i]) && (bads[i] != this)) {
				bads.splice(i, 1);
				spawnBaddies(1);
			}
		}
	}

	draw() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
		//ctx.fillStyle = "#FA6666";
		//ctx.strokeStyle = "#de0800";
		ctx.strokeStyle = "lightgray"
		ctx.lineWidth = 7;
		ctx.stroke();
		ctx.closePath();
	}

	bounce() {
		if (this.y + this.r >= canvas.clientHeight) {
			this.yv *= -this.speed;
			this.y = canvas.clientHeight - this.r;
			//this.xv *= 0.9;
		}

		if (this.y - this.r <= 0) {
			this.yv *= -this.speed;
			this.y = this.r;
			//this.xv *= 0.9;
		}

		if (this.x + this.r >= canvas.clientWidth) {
			this.xv *= -this.speed;
			this.x = canvas.clientWidth - this.r;
		}

		if (this.x - this.r <= 0) {
			this.xv *= -this.speed;
			this.x = this.r;
		}

		if (this.xv < 0.01 && this.xv > -0.01) {
			this.xv = 0;
		}
		if (this.yv < 0.01 && this.yv > -0.01) {
			this.yv = 0;
		}

		//this.yv += 0.25;
		if (this.speedMulto < 1.5) {
			this.speedMulto = 1.5;
		}
		this.x += this.xv / this.speedMulto;
		this.y += this.yv / this.speedMulto;
	}
}

class Button {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.x = this.x - this.w / 2;
		this.y = this.y + this.h;
		this.color = "rgba(0, 0,0,0)";
	}

	draw() {
		ctx.beginPath();
		ctx.strokeStyle = "white";
		ctx.lineWidth = 3;
		ctx.fillStyle = this.color;
		ctx.roundRect(this.x, this.y, this.w, this.h, 15);
		ctx.stroke();
		ctx.fill();
		ctx.closePath();
	}
}

function getRandomNumber(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function goodColl(goodie, circle) {
	const dx = circle.x - goodie.x;
	const dy = circle.y - goodie.y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	const colliding = distance < circle.r + goodie.r;
	return colliding;
}

function startGame() {
	dead = false;
	score = 0;
	bads = [];
	player.x = canvas.clientWidth / 2;
	player.y = canvas.clientHeight / 2;
	player.xv = 0;
	player.yv = 0;
	spawnBaddies(numBaddies);
	good.newPos();
}

function gameOver() {
	dead = true;
}

window.addEventListener("keydown", function(e) {
	if (e.keyCode === 87 || e.keyCode === 38) {
		UP = true;
	}
	if (e.keyCode === 83 || e.keyCode === 40) {
		DOWN = true
	}
	if (e.keyCode === 65 || e.keyCode === 37) {
		LEFT = true;
	}
	if (e.keyCode === 68 || e.keyCode === 39) {
		RIGHT = true;
	}

	if (e.keyCode === 32) {
		if (dead) {
			startGame();
		}
	}

	if (e.keyCode === 88) {
		let password = prompt("Enter Passcode: ");
		if (password === "9134") {
			prompt("Nice Job You Learned How To Press Ctrl+I. Wow. :|");
			player.r = getRandomNumber(500, 400);
			prompt("Someone got chunky")
		}
	}
});

window.addEventListener("keyup", function(e) {
	if (e.keyCode === 87 || e.keyCode === 38) {
		UP = false;
	}
	if (e.keyCode === 83 || e.keyCode === 40) {
		DOWN = false;
	}
	if (e.keyCode === 65 || e.keyCode === 37) {
		LEFT = false;
	}
	if (e.keyCode === 68 || e.keyCode === 39) {
		RIGHT = false;
	}
});

function is_touch_enabled() {
	return ('ontouchstart' in window) ||
		(navigator.maxTouchPoints > 0) ||
		(navigator.msMaxTouchPoints > 0);
}

console.log(is_touch_enabled());

let player = new Player(canvas.clientWidth / 2, canvas.clientHeight / 2, 20);
let good = new Good(15, 15, 15);
good.newPos();
spawnBaddies(numBaddies);
let startButton = new Button(canvas.width / 2 + 10, canvas.height / 2, 250, 75);

function spawnBaddies(num) {
	for (let i = 0; i < num; i++) {
		let random = getRandomNumber(1, 4);
		let radius = getRandomNumber(20, 40);
		if (random === 1) {
			new Bad(0 + radius, getRandomNumber(0 + radius, canvas.clientHeight - radius), radius);
		}
		if (random === 2) {
			new Bad(canvas.clientWidth - radius, getRandomNumber(0 + radius, canvas.clientHeight - radius), radius);
		}
		if (random === 3) {
			new Bad(getRandomNumber(0 + radius, canvas.clientWidth), 0 + radius, radius);
		}
		if (random === 4) {
			new Bad(getRandomNumber(0 + radius, canvas.clientWidth), canvas.clientHeight - radius, radius);
		}
	}
}

function mainLoop() {
	if (!dead) {
		if (is_touch_enabled() && canvas.width < 720) {
			joystick();
		}
		moveLoop();
	}
	drawLoop();
	requestAnimationFrame(mainLoop);
}

function moveLoop() {
	for (let i = 0; i < bads.length; i++) {
		bads[i].bounce();
	}
	player.move();
}

function drawLoop() {
	ctx.beginPath();
	ctx.fillStyle = "#000737";
	ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	for (let i = 0; i < bads.length; i++) {
		bads[i].draw();
	}
	player.draw();
	good.draw();
	drawScore();
	if (dead) {
		drawDead();
	} else {
		if (is_touch_enabled() && touching && canvas.width < 720) {
			drawJoystick();
		}
	}
}

function joystick() {
	if (stickX > touchX + 40) {
		stickX = touchX + 40;
	}
	if (stickX < touchX - 40) {
		stickX = touchX - 40;
	}
	if (stickY > touchY + 40) {
		stickY = touchY + 40;
	}
	if (stickY < touchY - 40) {
		stickY = touchY - 40;
	}

	if (stickX > touchX + 39) {
		RIGHT = true;
	} else {
		RIGHT = false;
	}

	if (stickX < touchX - 39) {
		LEFT = true;
	} else {
		LEFT = false;
	}

	if (stickY > touchY + 39) {
		DOWN = true;
	} else {
		DOWN = false;
	}

	if (stickY < touchY - 39) {
		UP = true;
	} else {
		UP = false;
	}
}

function drawJoystick() {
	ctx.beginPath();
	ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
	ctx.arc(touchX, touchY, 60, 0, Math.PI * 2);
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctx.fillStyle = "rgba(50, 50, 50, 0.7)"
	ctx.arc(stickX, stickY, 25, 0, Math.PI * 2);
	ctx.fill();
}

window.addEventListener("touchstart", function(e) {
	var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
	var touch = evt.touches[0] || evt.changedTouches[0];

	touchX = touch.pageX;
	touchY = touch.pageY;
	stickX = touch.pageX;
	stickY = touch.pageY;
	touching = true;
});

window.addEventListener("touchmove", function(e) {
	var evt = (typeof e.originalEvent === 'undefined') ? e : e.originalEvent;
	var touch = evt.touches[0] || evt.changedTouches[0];

	stickX = touch.pageX;
	stickY = touch.pageY;
});

window.addEventListener("touchend", function() {
	touching = false;
	stickX = touchX;
	stickY = touchY;
});

function drawDead() {
	ctx.beginPath();
	ctx.fillStyle = "rgba(50, 50, 50, 0.6)";
	ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	ctx.fill();
	ctx.stroke();
	ctx.fillStyle = "#0000A4";
	ctx.strokeStyle = "#001285";
	ctx.font = "100px Verdana";
	ctx.fillText("Game Over", canvas.clientWidth / 2 - 285, canvas.clientHeight / 2 - 100, undefined);
	ctx.strokeText("Game Over", canvas.clientWidth / 2 - 285, canvas.clientHeight / 2 - 100, undefined);
	ctx.stroke();
	ctx.fill();
	startButton.draw();
	ctx.font = "50px Verdana";
	ctx.strokeStyle = "white";
	ctx.lineWidth = 1;
	ctx.fillStyle = "#A9A9A9";
	ctx.strokeText("Restart", canvas.clientWidth / 2 - 83, canvas.clientHeight / 2 + 125, undefined);
	ctx.closePath();
}

function drawScore() {
	ctx.beginPath();
	ctx.fillStyle = "#0000A4";
	ctx.font = "40px Verdana";
	ctx.strokeStyle = "#001285";
	ctx.lineWidth = 4;
	ctx.strokeText("Score: " + score, 15, 40, undefined);
	ctx.fillText("Score: " + score, 15, 40, undefined);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
}

function rectIsTouching(thing) {
	if (thing.x >= startButton.x &&         // right of the left edge AND
		thing.x <= startButton.x + startButton.w &&    // left of the right edge AND
		thing.y >= startButton.y &&         // below the top AND
		thing.y <= startButton.y + startButton.h) {    // above the bottom
				return true;
	}
	return false;
}

window.addEventListener("mousedown", function(e) {
	if (rectIsTouching(e) && dead) {
		startGame();
	}
});

window.addEventListener("mousemove", function(e) {
	console.log(rectIsTouching(e));
	if (rectIsTouching(e)) {
		startButton.color = "rgba(25, 25, 200, 0.5)";
	} else {
		startButton.color = "rgba(0,0,0,0)";
	}
});

window.requestAnimationFrame(mainLoop);
