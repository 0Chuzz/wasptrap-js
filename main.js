
Wasp = {
      width: 40
    , height: 40
    , minSpeed: 1
    , maxSpeed: 15
    , friction: 0.05
    , acceleration: 1

    , create : function(){
        var ret = this;
        ret.x = 400;
        ret.y = 300;
        ret.speed = this.minSpeed;
        ret.xDir = 0;
        ret.yDir = 0;
        return ret;
    }

    , getDirection: function(){
        return Math.atan2(this.yDir, this.xDir);
    }

    , drawOn: function(ctx) {
        ctx.fillStyle="#ffff00";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    , step: function(){
        this.x += this.speed * this.xDir;
        this.y += this.speed * this.yDir;
        if(this.speed > this.minSpeed) {
            this.speed -= this.friction;
        }
    }

    , onBounce: function(xdiff, ydiff){
        this.x -= xdiff;
        this.y -= ydiff;
        this.speed = this.minSpeed;
    }
    
    , accelerate: function(){
        if(this.speed < this.maxSpeed && this.accelpressed === false){
            this.speed += this.acceleration;
        }
        this.accelpressed = true;
    }

    , unaccel: function(){ this.accelpressed = false; }

    , toUp: function(){
        if(this.yDir > -1) this.yDir--;
    }

    , toDown: function(){
        if(this.yDir < 1) this.yDir++;
    }

    , toLeft: function(){
        if(this.xDir > -1) this.xDir--;
    }

    , toRight: function(){
        if(this.xDir < 1) this.xDir++;
    }

}

Ball = {
      radius: 10
    , width: 10
    , height: 10
    , minSpeed: 1
    , maxSpeed: 100

    , create : function(){
        var ret = Object.create(this);
        ret.x = 200 + Math.random()*100;
        ret.y = 100 + Math.random()*100;
        var direction = Math.random()*360;
        ret.setSpeed(this.minSpeed, direction);
        return ret;
    }
    
    , setSpeed: function(speed, direction){
        this.dx = speed * Math.cos(direction);
        this.dy = speed * Math.sin(direction);
    }

    , drawOn: function(ctx) {
        ctx.fillStyle="#ff0000";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.closePath();
        ctx.fill();
    }

    , step: function(){
        this.x += this.dx;
        this.y += this.dy;
    }
    
    , onBounce: function(xdiff, ydiff){
        this.x -= 2* xdiff;
        if(xdiff != 0) this.dx *= -1;
        this.y -= 2* ydiff;
        if(ydiff != 0) this.dy *= -1;

        this.dx *= 1.5;
        this.dy *= 1.5;
        
        var dx = this.dx;
        var dy = this.dy;
        var split = (dx*dx + dy*dy) > this.maxSpeed*this.maxSpeed;
        if (split) {
            var newBall = Ball.cloneBall(this, xdiff, ydiff);
            Game.addBall(newBall);
            var direction = Math.atan2(dx, dy);
            this.setSpeed(this.minSpeed, direction);
        }
    }
    , cloneBall: function(oldBall, xdiff, ydiff){
        return Ball.create();
    }
}

Game = {
      wasp: Wasp.create()
    , balls: []
    , fps: 60

    , initialize: function(canvas){
        var ret = this;
        ret.canvas = canvas;
        document.addEventListener("keydown", function(evt){ ret.onKeyDown(evt);}, false);
        document.addEventListener("keyup", function(evt){ ret.onKeyUp(evt);}, false);
        ret.ctx = canvas.getContext("2d");
        ret.ticks = 0;
        ret.score = 0;
        this.balls = [Ball.create()];
        return this;
    }

    , onKeyUp: function(evt){
        switch(evt.keyCode){
            case 32: // space
                this.wasp.unaccel();
                break;
            case 37: // left
                this.wasp.toRight();
                break;
            case 38: // up
                this.wasp.toDown();
                break;
            case 39: // right
                this.wasp.toLeft();
                break;
            case 40: // down
                this.wasp.toUp();
                break;
        };
    }

    , onKeyDown: function(evt){
        switch(evt.keyCode){
            case 32: // space
                this.wasp.accelerate();
                break;
            case 37: // left
                this.wasp.toLeft();
                break;
            case 38: // up
                this.wasp.toUp();
                break;
            case 39: // right
                this.wasp.toRight();
                break;
            case 40: // down
                this.wasp.toDown();
                break;
        };
    }
    
    , startLoop: function () {
        var jswut = this;
        setInterval(function () {jswut.loop();}, 1000/this.fps);
    }

    , loop: function(){
        this.physics();
        this.draw();
        this.ticks++;
    }

    , physics: function(){
        this.wasp.step();
        this.checkOOB(this.wasp);
        for (i in this.balls){
            this.balls[i].step();
            this.checkOOB(this.balls[i]);
        }
        this.checkCollisions();

    }

    , checkOOB: function(obj){
        var width = this.canvas.width - obj.width;
        var height = this.canvas.height - obj.height;
        var xdiff = (obj.x < 0) ? obj.x : (obj.x > width) ? obj.x - width : 0;
        var ydiff = (obj.y < 0) ? obj.y : (obj.y > height) ? obj.y - height : 0;
        if ( xdiff !== 0 || ydiff !== 0){
            obj.onBounce(xdiff, ydiff);
            this.score++;
        }
    }

    , checkCollisions: function(){
        var xlow = this.wasp.x;
        var ylow = this.wasp.y;
        var xhi = xlow + this.wasp.width;
        var yhi = ylow + this.wasp.height;
        for(i in this.balls){
            var x = this.balls[i].x;
            var y = this.balls[i].y;
            if (x > xlow && x < xhi && y > ylow && y < yhi){
                this.stopTurn();
                break;
            }
        }
    }

    , draw: function () {
        var ctx = this.ctx;
        ctx.clearRect(0, 0, 800, 600);
        this.wasp.drawOn(ctx);
        for (i in this.balls){
            this.balls[i].drawOn(ctx);
        }
        ctx.fillStyle = "#000000";
        ctx.textAlign = "right";
        ctx.fillText(this.score, 780, 20);
    }

    , addBall: function (ball){
        this.balls.push(ball);
        this.score += 9;
    }

    , stopTurn: function () {
        this.state = 1;
    }
}


window.onload = function (){
    var ctx = document.getElementById("screen");
    Game.initialize(ctx);
    Game.startLoop();
}
