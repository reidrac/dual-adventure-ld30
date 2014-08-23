/**
 * Dual Adventure
 * @license Copyright (C) 2014 by Juan J. Martinez <jjm@usebox.net>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Resource manager?

var Manager = function(width, height, cb_done) {
	var self = {
		cb_done: cb_done,
		count: 0,
		total: 4,
		resources: {}
	};

	self.init = function() {
		var res = {
			font: "img/font.png",
			clouds0: "img/clouds0.png",
			clouds1: "img/clouds1.png",
			title: "img/dual.png"
		};

		for(id in res) {
			self.resources[id] = new Image();
			self.resources[id].src = res[id];
			self.resources[id].onload = function() {
				self.count++;
				if (self.count == self.total) {
					self.cb_done();
				}
			};
		}

		return self;
	};

	self.render_text = function(text, id) {
		var W = 6, H = 11;
		var map = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?()@:/'.,- ";
		var c = document.createElement("canvas");
		c.width = text.length*W;
		c.height = H;
		var ctx = c.getContext("2d");

		ctx.clearRect(0, 0, c.width, c.height);
		for(var i = 0; i < text.length; i++) {
			var index = map.indexOf(text.charAt(i));
			if(index >= 0) {
				ctx.drawImage(self.resources["font"], index * W, 0, W, H, i * W, 0, W, H);
			} else {
				console.log("ERROR: " + text.charAt(i) + " not in map, from: " + text);
			}
		}

		if (id != undefined) {
			self.resources[id] = c;
		}

		return c;
	};

	return self.init();
};


// main game object

var Game = function(id) {
	var self = {
		id: id,
		canvas: undefined,
		ctx: undefined,

		// resources
		manager: undefined,

		width: 320,
		height: 240,
		scale: 0,

		state: "loading",
		paused: false,

		// controls
		up: false,
		down: false,
		left: false,
		right: false,
		fire: false,

		dt: 0,
		then: 0
	};

	self.init = function() {
		self.canvas = document.getElementById(self.id);
		if(!self.canvas.getContext) {
			self.canvas.insertAdjacentHTML("afterend", "<h1>This game requires canvas 2D support :(</h1>");
			return undefined;
		}

		self.canvas.style.background = "rgb(21, 21, 21)";
		self.ctx = self.canvas.getContext("2d");

		self.onresize();

		document.addEventListener("keydown", self.key_down, false);
		document.addEventListener("keyup", self.key_up, false);

		window.onresize = self.onresize;

		self.manager = Manager(self.width, self.height, self.loading_done);

		return self;
	};

	self.onresize = function() {
		var factor = window.innerHeight / self.height;
		self.scale = Math.floor(factor);
		self.canvas.width = self.width * self.scale;
		self.canvas.height = self.height * self.scale;

		if (self.ctx != undefined) {
			var smoothing = ['imageSmoothingEnabled', 'mozImageSmoothingEnabled', 'webkitImageSmoothingEnabled', 'oImageSmoothingEnabled'];
			smoothing.every(function(element, index, array) {
				if(self.ctx[element]) {
					self.ctx[element] = false;
					return false;
				}
				return true;
			});
		}
	};

	self.loading_done = function() {
		self.manager.render_text("Press S to Start!", "press_s");
		self.manager.render_text("a game by @reidrac for LD30", "game_by");
		self.manager.render_text("PAUSED GAME", "paused");
		self.manager.render_text("(press P again to resume)", "resume");

		self.canvas.style.background = "rgb(255, 130, 206)";
		self.bg_offset = [0.0, 0.0];
		self.state = "menu";
	};

	self.draw_loading = function(ctx) {
		ctx.save();
		ctx.fillStyle = "rgb(106, 49, 202)";
		ctx.fillRect(10, Math.floor(self.height / 2) - 4, self.width - 20, 8);
		ctx.fillStyle = "rgb(255, 130, 206)";
		ctx.fillRect(10, Math.floor(self.height / 2) - 2, (self.manager.count * (self.width - 20)) / self.manager.total, 4);
		ctx.restore();
	};

	self.draw_menu = function(ctx, no_transition) {
		ctx.drawImage(self.manager.resources["clouds1"], Math.floor(self.bg_offset[0]), self.height - self.manager.resources["clouds1"].height - 20);
		ctx.drawImage(self.manager.resources["clouds1"], Math.floor(self.bg_offset[0]) - self.width, self.height - self.manager.resources["clouds1"].height - 20);

		ctx.drawImage(self.manager.resources["clouds0"], Math.floor(self.bg_offset[1]), self.height - self.manager.resources["clouds0"].height);
		ctx.drawImage(self.manager.resources["clouds0"], Math.floor(self.bg_offset[1]) - self.width, self.height - self.manager.resources["clouds0"].height);

		ctx.drawImage(self.manager.resources["title"], Math.floor(self.width / 2 - self.manager.resources["title"].width / 2), 30);
		ctx.drawImage(self.manager.resources["press_s"], Math.floor(self.width / 2 - self.manager.resources["press_s"].width / 2), 148);
		ctx.drawImage(self.manager.resources["game_by"], Math.floor(self.width / 2 - self.manager.resources["game_by"].width / 2), 224);
	};

	self.draw_paused = function(ctx) {
		ctx.save();
		ctx.fillStyle = "rgba(33, 22, 64, 0.8)";
		ctx.fillRect(0, 0, self.width, self.height);
		ctx.drawImage(self.manager.resources["paused"], Math.floor(self.width / 2 - self.manager.resources["paused"].width / 2), self.height / 2 - 16);
		ctx.drawImage(self.manager.resources["resume"], Math.floor(self.width / 2 - self.manager.resources["resume"].width / 2), self.height / 2 - 2);
		ctx.restore();
	};

	self.draw = function() {
		self.ctx.save();
		self.ctx.scale(self.scale, self.scale);
		switch(self.state) {
			case "loading":
				self.ctx.clearRect(0, 0, self.width, self.height);
				self.draw_loading(self.ctx);
			break;
			case "menu":
				self.ctx.clearRect(0, 0, self.width, self.height);
				self.draw_menu(self.ctx);
			break;
			case "play":
				self.ctx.clearRect(0, 0, self.width, self.height);
				self.draw_menu(self.ctx);
				if (self.paused) {
					self.draw_paused(self.ctx);
				}
			break;
		};
		self.ctx.restore();
	};

	self.update = function update(dt) {
		if(self.paused) {
			return;
		}

		switch(self.state) {
			case "menu":
				self.bg_offset[0] += self.bg_offset[0] > self.width ? -self.width : 40 * dt;
				self.bg_offset[1] += self.bg_offset[1] > self.width ? -self.width : 80 * dt;
			break;
		}
	};

	self.loop = function loop(now) {
		var k = 1 / 80;
		self.dt += Math.min(1 / 60, now - self.then) || 0;
		while(self.dt >= k) {
			self.update(k);
			self.dt -= k;
		}

		self.draw();

		self.then = now;
		requestAnimationFrame(self.loop);
	};

	self.key_down = function(event) {
		switch(self.state) {
			case "menu":
				if(event.keyCode == 83) {
					self.state = "play";
				}
			break;
			case "play":
				if(event.keyCode == 80) {
					self.paused = !self.paused;
					return;
				}

				if(event.keyCode == 38) {
					self.up = true;
					event.preventDefault();
				}
				if(event.keyCode == 39) {
					self.right = true;
					event.preventDefault();
				}
				if(event.keyCode == 40) {
					self.down = true;
					event.preventDefault();
				}
				if(event.keyCode == 37) {
					self.left = true;
					event.preventDefault();
				}
				if(event.keyCode == 90) {
					self.fire = true;
					event.preventDefault();
				}
			break;
		};
	};

	self.key_up = function(event) {
		if(self.state == "play") {
			if(event.keyCode == 38) {
				self.up = false;
			}
			if(event.keyCode == 39) {
				self.right = false;
			}
			if(event.keyCode == 40) {
				self.down = false;
			}
			if(event.keyCode == 37) {
				self.left = false;
			}
			if(event.keyCode == 90) {
				self.fire = false;
			}
		}
	};

	return self.init();
};

window.onload = function () {
	var game = Game("game");
	if(game != undefined) {
		game.loop(0);
	}
};


