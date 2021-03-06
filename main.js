/*jslint browser: true, plusplus: true, sloppy: false, vars: true */
var Game;

var Box = {
    centered: function(x, y, w, h) {
        var ret = Object.create(this);
        ret.xmin = x - w / 2;
        ret.ymin = y - h / 2;
        ret.xmax = x + w / 2;
        ret.ymax = y + h / 2;
        return ret;
    },
    topleft: function(x, y, w, h) {
        var ret = Object.create(this);
        ret.xmin = x;
        ret.ymin = y;
        ret.xmax = x + w;
        ret.ymax = y + h;
        return ret;
    },
    borders: function(xmin, ymin, xmax, ymax) {
        var ret = Object.create(this);
        ret.xmin = xmin;
        ret.ymin = ymin;
        ret.xmax = xmax;
        ret.ymax = ymax;
        return ret;
    },
    collides: function(obj) {
        var ret = true,
            condcheck = false;
        if (obj.x !== undefined) {
            ret = ret && obj.x > this.xmin && obj.x < this.xmax;
            condcheck = true;
        }
        if (obj.y !== undefined) {
            ret = ret && obj.y > this.ymin && obj.y < this.ymax;
            condcheck = true;
        }
        if (obj.xmin !== undefined && obj.xmax !== undefined) {
            ret = ret && obj.xmin < this.xmax && obj.xmax > this.xmin;
            condcheck = true;
        }
        if (obj.ymin !== undefined && obj.xmax !== undefined) {
            ret = ret && obj.ymin < this.ymax && obj.ymax > this.ymin;
            condcheck = true;
        }
        return ret && condcheck;
    },
    exits: function(obj) {
        var ret = false;

    }
};

var Wasp = {
    width: 40,
    height: 40,
    minSpeed: 1,
    maxSpeed: 15,
    friction: 0.05,
    acceleration: 1,

    create: function() {
        var ret = this;
        ret.xDir = 0;
        ret.yDir = 0;
        this.teleport(0, 0);
        return ret;
    },
    getDirection: function() {
        return Math.atan2(this.yDir, this.xDir);
    },
    drawOn: function(ctx) {
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "#000000";
        ctx.fillRect(this.x, this.y, 1, 1);
    },
    step: function(game) {
        this.x += this.speed * this.xDir;
        this.y += this.speed * this.yDir;
        if (this.accelpressed > 0 && this.speed < this.maxSpeed) {
            this.speed += this.acceleration;
            this.accelpressed -= 1;
        } else if (this.speed > this.minSpeed) {
            this.speed -= this.friction;
        }
        var oob = game.checkOOB(this);
        if (oob.x !== 0 || oob.y !== 0) {
            this.onBounce(oob.x, oob.y);
        }
    },
    onBounce: function(xdiff, ydiff) {
        this.x -= xdiff;
        this.y -= ydiff;
        this.speed = this.minSpeed;
    },
    getBoundingBox: function() {
        return Box.topleft(this.x, this.y, this.width, this.height);
    },
    accelerate: function() {
        this.accelpressed = 1;
    },
    teleport: function(x, y) {
        var ret = this;
        ret.x = x;
        ret.y = y;
        ret.speed = this.minSpeed;

    },
    toUp: function() {
        if (this.yDir > -1) {
            this.yDir--;
        }
    },
    toDown: function() {
        if (this.yDir < 1) {
            this.yDir++;
        }
    },
    toLeft: function() {
        if (this.xDir > -1) {
            this.xDir--;
        }
    },
    toRight: function() {
        if (this.xDir < 1) {
            this.xDir++;
        }
    }

};

var Ball = {
    radius: 10,
    minSpeed: 1,
    maxSpeed: 100,
    create: function() {
        var ret = Object.create(this);
        ret.x = 200 + Math.random() * 100;
        ret.y = 100 + Math.random() * 100;
        var direction = Math.random() * 360;
        ret.setSpeed(this.minSpeed, direction);
        return ret;
    },
    getBoundingBox: function() {
        return Box.centered(this.x, this.y, this.radius, this.radius);
    },
    setSpeed: function(speed, direction) {
        this.dx = speed * Math.cos(direction);
        this.dy = speed * Math.sin(direction);
    },
    drawOn: function(ctx) {
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();

    },
    step: function(game) {
        this.x += this.dx;
        this.y += this.dy;
        var oob = game.checkOOB(this);
        if (oob.x !== 0 || oob.y !== 0)
            this.onBounce(oob.x, oob.y);
    },
    onBounce: function(xdiff, ydiff) {
        this.x -= 2 * xdiff;
        if (xdiff !== 0) {
            this.dx *= -1;
        }
        this.y -= 2 * ydiff;
        if (ydiff !== 0) {
            this.dy *= -1;
        }

        this.dx *= 1.5;
        this.dy *= 1.5;

        var dx = this.dx;
        var dy = this.dy;
        var split = (dx * dx + dy * dy) > this.maxSpeed * this.maxSpeed;
        if (split) {
            var newBall = Ball.cloneBall(this, xdiff, ydiff);
            Game.addBall(newBall);
            var direction = Math.atan2(dx, dy);
            this.setSpeed(this.minSpeed, direction);
            Game.score += 9;
        } else {
            Game.score++;
        }
    },
    cloneBall: function(oldBall, xdiff, ydiff) {
        return Ball.create();
    }
};

var Game = {
    width: 800,
    height: 600,
    balls: [],
    fps: 60,
    initialize: function(canvas) {
        var ret = this;
        ret.canvas = canvas;
        document.addEventListener("keydown", function(evt) {
            ret.onKeyDown(evt);
        }, false);
        document.addEventListener("keyup", function(evt) {
            ret.onKeyUp(evt);
        }, false);
        ret.ctx = canvas.getContext("2d");
        ret.ticks = 0;
        ret.score = 0;
        ret.lives = 3;
        ret.ctx.scale(this.canvas.width / this.width,
            this.canvas.height / this.height);
        this.wasp = Wasp.create();
        this.balls = [];
        ret.newTurn();
        return this;
    },
    newTurn: function() {
        this.wasp.teleport(this.width / 2, this.height / 2);
        this.balls = [Ball.create()];
    },
    onKeyUp: function(evt) {
        switch (evt.keyCode) {
            case 32:
                // space
                this.wasp.unaccel();
                break;
            case 37:
                // left
                this.wasp.toRight();
                break;
            case 38:
                // up
                this.wasp.toDown();
                break;
            case 39:
                // right
                this.wasp.toLeft();
                break;
            case 40:
                // down
                this.wasp.toUp();
                break;
        }
    },
    onKeyDown: function(evt) {
        switch (evt.keyCode) {
            case 32:
                // space
                this.wasp.accelerate();
                break;
            case 37:
                // left
                this.wasp.toLeft();
                break;
            case 38:
                // up
                this.wasp.toUp();
                break;
            case 39:
                // right
                this.wasp.toRight();
                break;
            case 40:
                // down
                this.wasp.toDown();
                break;
        }
    },
    startLoop: function() {
        var jswut = this;
        this.loopHandle = setInterval(function() {
            jswut.loop();
        }, 1000 / this.fps);
    },
    stopLoop: function() {
        clearInterval(this.loopHandle);
    },
    loop: function() {
        this.physics();
        this.draw();
        this.ticks++;
    },
    physics: function() {
        var i;
        this.wasp.step(this);
        for (i = 0; i < this.balls.length; i++) {
            this.balls[i].step(this);
        }
        this.checkCollisions();

    },
    checkOOB: function(obj) {
        var bb = obj.getBoundingBox();
        var width = this.width;
        var height = this.height;
        var xdiff = (bb.xmin < 0) ? bb.xmin : (bb.xmax > width) ? bb.xmax -
            width : 0;
        var ydiff = (bb.ymin < 0) ? bb.ymin : (bb.ymax > height) ? bb.ymax -
            height : 0;
        return {
            x: xdiff,
            y: ydiff
        };
    },
    checkCollisions: function() {
        var wbb = this.wasp.getBoundingBox();
        var i;
        for (i = 0; i < this.balls.length; i++) {
            if (wbb.collides(this.balls[i].getBoundingBox())) {
                this.stopTurn(this.balls[i]);
                break;
            }
        }
    },
    draw: function() {
        var ctx = this.ctx;
        var i;
        ctx.clearRect(0, 0, this.width, this.height);
        this.wasp.drawOn(ctx);
        for (i = 0; i < this.balls.length; i++) {
            this.balls[i].drawOn(ctx);
        }
        ctx.fillStyle = "#000000";
        ctx.textAlign = "right";
        ctx.fillText(this.score, this.width - 20, 20);

        for (i = 0; i < this.lives; i++) {
            this.drawHeart(ctx, this.width - 50 - 20 * i, 20);
        }
    },
    drawHeart: function(ctx, x, y) {
        var size = 5;
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(x - size, y, size, Math.PI, 0, false);
        ctx.arc(x + size, y, size, Math.PI, 0, false);
        ctx.lineTo(x, y + size * 2);
        ctx.lineTo(x - size * 2, y);
        ctx.closePath();
        ctx.fill();
    },
    addBall: function(ball) {
        this.balls.push(ball);
        this.score += 9;
    },
    stopTurn: function() {
        this.lives -= 1;
        if (this.lives === 0) {
            document.writeln("game over");
            this.stopLoop();
        } else {
            this.newTurn();
        }
    }
};


window.onload = function() {
    var ctx = document.getElementById("screen");
    ctx.width = window.innerWidth - 2;
    ctx.height = window.innerHeight - 10;
    Game.initialize(ctx);
    Game.startLoop();
};
