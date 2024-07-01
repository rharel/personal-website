function e(e,t,i){return e<t?t:e>i?i:e}class t{constructor(e,t){this.x=e,this.y=t}clamp(i,l){return new t(e(this.x,i.x,l.x),e(this.y,i.y,l.y))}distance_squared_to(e){return(this.x-e.x)*(this.x-e.x)+(this.y-e.y)*(this.y-e.y)}magnitude(){return Math.sqrt(this.distance_squared_to(new t(0,0)))}normalized(){return new t(this.x/this.magnitude(),this.y/this.magnitude())}plus(e){return new t(this.x+e.x,this.y+e.y)}times(e){return new t(this.x*e,this.y*e)}}function i(e){return{ball_position:new t(0,0),ball_velocity:new t(0,e.ball_initial_speed),player_paddle_x:0,ai_paddle_x:0,...e}}function l(e){return e.ball_position.y-e.ball_radius<-1?"player":e.ball_position.y+e.ball_radius>1?"ai":null}function a(e,i,l,a,n,d,o,s){let r=d-.5*s,_=d+.5*s,h=l.clamp(new t(n-.5*o,r),new t(n+.5*o,_));if(!(l.distance_squared_to(h)<e*e))return{position:l,velocity:a};let p=a.y<0?_+e+.001:r-e-.001,u=a.normalized();u.y*=-1;let c=Math.abs((l.y-p)/u.y),y=l.plus(u.times(c)),x=.5*Math.PI-(y.x-n)/(.5*o)*i;return{position:y,velocity:new t(Math.cos(x),-Math.sign(a.y)*Math.sin(x)).times(a.magnitude())}}window.addEventListener("DOMContentLoaded",function(){let n=document.getElementById("demo-canvas");if(!(n instanceof HTMLCanvasElement))throw Error("cannot find canvas");let d=n.getContext("2d",{alpha:!1});if(null===d)throw Error("cannot get context");let o={ball_radius:.05,ball_initial_speed:1.6,ball_max_bounce_angle:.3*Math.PI,paddle_width:.4,paddle_height:.05,ai_movement_speed:1},s="white",r="#ed12a5",_=i(o),h=null;n.addEventListener("mousemove",e=>{e.preventDefault(),_.player_paddle_x=-1+e.offsetX/n.clientWidth*2}),n.addEventListener("touchmove",e=>{let t=e.touches.item(0);if(null===t)return;e.preventDefault();let i=n.getBoundingClientRect();_.player_paddle_x=-1+(t.clientX-i.left)/n.clientWidth*2});let p=()=>{var n;let u=performance.now(),c=h?(u-h)/1e3:0;(h=u,n=_=function(i,n){var d,o;if(null!==l(i))return i;let{ball_radius:s,ball_max_bounce_angle:r,paddle_width:_,paddle_height:h,ai_movement_speed:p}=i,u={position:i.ball_position.plus(i.ball_velocity.times(n)),velocity:i.ball_velocity};return u=a(s,r,u.position,u.velocity,i.player_paddle_x,1-.5*i.paddle_height,_,h),d=(u=a(s,r,u.position,u.velocity,i.ai_paddle_x,-1+.5*i.paddle_height,_,h)).position,o=u.velocity,u=d.x-s<-1?{position:new t(-1+s,d.y),velocity:new t(-1*o.x,o.y)}:d.x+s>1?{position:new t(1-s,d.y),velocity:new t(-1*o.x,o.y)}:{position:d,velocity:o},{...i,ball_position:u.position,ball_velocity:u.velocity,ai_paddle_x:i.ai_paddle_x+n*function(t,i,l,a,n,d,o,s,r){let _;if(a.y>=0)return 0;let h=Math.sign(a.y),p=Math.sign(a.x),u=(Math.abs(h-l.y)-s-t)/Math.abs(a.y),c=Math.abs(a.x*u),y=Math.abs(p-l.x)-t;if(c<y)_=l.x+a.x*u;else{let e=2-2*t,i=Math.floor((c-y)/e),l=(c-y)%e;_=i%2==0?p-Math.sign(a.x)*l:-p+Math.sign(a.x)*l}let x=Math.atan((-Math.sign(n)*(1-t)-_)/2);return r*(_-.5*e(x/i,-1,1)*o-d)}(s,r,u.position,u.velocity,i.player_paddle_x,i.ai_paddle_x,_,h,p)}}(_,c),d.fillStyle=s,d.fillRect(0,0,d.canvas.width,d.canvas.height),d.save(),d.scale(d.canvas.width/2,d.canvas.height/2),d.translate(1,1),d.fillStyle=r,d.beginPath(),d.rect(n.player_paddle_x-.5*n.paddle_width,1-n.paddle_height,n.paddle_width,n.paddle_height),d.rect(n.ai_paddle_x-.5*n.paddle_width,-1,n.paddle_width,n.paddle_height),d.arc(n.ball_position.x,n.ball_position.y,n.ball_radius,0,2*Math.PI),d.fill(),d.restore(),null!==l(_))?("player"===l(_)&&o.ball_initial_speed<3&&(o.ball_initial_speed+=.2,o.ai_movement_speed+=.2),_=i(o),h=null,setTimeout(()=>requestAnimationFrame(p),1e3)):requestAnimationFrame(p)};p()});
//# sourceMappingURL=index.d81e8cd7.js.map