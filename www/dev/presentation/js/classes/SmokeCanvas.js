/*
 * http://codepen.io/MIML/pen/iBKyC?editors=001
 */
module.exports = (function(){
	var Class = require('core/Class');

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
	var maxLifeTime = 5000;

	var SmokeCanvas = Class.extend({
		fps: 60,
		width: 0,
		height: 0,

		parts: [],
		minSpawnTime: 200,
		lastTime: new Date().getTime(),
		emitterX: 500,
		emitterY: 380,
		smokeImage: new Image(),

		init: function(canvas) {
			this.canvas = canvas;
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
			this.ctx = this.canvas.getContext('2d');

			maxLifeTime = Math.min(3000, (this.canvas.height/(1.5*60)*1000));

			var that = this;
			this.smokeImage.src = "images/smoke.png";
			this.smokeImage.onload = function () {
			    that.render();
			};
		},
		render: function() {
			var len = this.parts.length;
		    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		    while (len--) {
		        if (this.parts[len].y < 0 || this.parts[len].lifeTime > maxLifeTime) {
		            this.parts.splice(len, 1);
		        } else {
		            this.parts[len].update();

		            this.ctx.save();
		            var offsetX = -this.parts[len].size/2,
		                offsetY = -this.parts[len].size/2;
		         
		            this.ctx.translate(this.parts[len].x-offsetX, this.parts[len].y-offsetY);
		            this.ctx.rotate(this.parts[len].angle / 180 * Math.PI);
		            this.ctx.globalAlpha  = this.parts[len].alpha;
		            this.ctx.drawImage(this.smokeImage, offsetX,offsetY, this.parts[len].size, this.parts[len].size);
		            this.ctx.restore();
		        }
		    }
		    this.spawn();
		    requestAnimationFrame($.proxy(this.render, this));
		},
		spawn: function() {
			var now = new Date().getTime();
			if(now > this.lastTime - this.minSpawnTime) {
				this.lastTime = now;
				this.parts.push(new Smoke(this.emitterX, this.emitterY));
			}
		}
	});

	var Smoke = Class.extend({
		init: function(x, y, index){
			this.x = x;
		    this.y = y;

		    this.size = 1;
		    this.startSize = 32;
		    this.endSize = 60;

		    this.angle = Math.random() * 359;

		    this.startLife = new Date().getTime();
		    this.lifeTime = 0;

		    this.velY = -2 - (Math.random()*0.5);
		    this.velX = Math.floor(Math.random() * (-4) + 2) / 10;
		},
		update: function() {
			this.lifeTime = new Date().getTime() - this.startLife;
		    this.angle += 0.2;
		    
		    var lifePerc = ((this.lifeTime / maxLifeTime) * 100);

		    this.size = this.startSize + ((this.endSize - this.startSize) * lifePerc * 0.1);

		    this.alpha = 1 - (lifePerc * 0.01);
		    this.alpha = Math.max(this.alpha, 0);
		    
		    this.x += this.velX;
		    this.y += this.velY;
		}
	});

	return SmokeCanvas;

})();