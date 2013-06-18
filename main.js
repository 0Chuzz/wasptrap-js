

Renderer = {
    mspf : 1000/60;

    create: function (canvas){
        var ret = Object.create(this);
        ret.canvas = canvas;
        ret.ctx = canvas.getContext("2d");
        ret.ticks = 0;
        return ret;
    },
    loop: function () {
        var jswut = this;
        setInterval(function () {jswut.draw();jswut.ticks++;}, this.mspf);
    },
    draw: function () {
        var ctx = this.ctx;
        ctx.clearRect(0, 0, 800, 600);
        ctx.fillRect(100+ 100*Math.sin(this.ticks/4),100, 100, 100);
    }
}

Wasp = {
    create : function(){
        var ret = Object.create(this);
        ret.x = 0;
        ret.y = 0;
        return ret;
    }
}

Game = {}


window.onload = function (){
    var ctx = document.getElementById("screen");
    renderer = Renderer.create(ctx);
    renderer.loop();
}
