!function(){function e(e,t,i){return e<t?t:e>i?i:e}class t{constructor(e,t){this.x=e,this.y=t}clamp(i,l){return new t(e(this.x,i.x,l.x),e(this.y,i.y,l.y))}distance_squared_to(e){return(this.x-e.x)*(this.x-e.x)+(this.y-e.y)*(this.y-e.y)}magnitude(){return Math.sqrt(this.distance_squared_to(new t(0,0)))}normalized(){return new t(this.x/this.magnitude(),this.y/this.magnitude())}plus(e){return new t(this.x+e.x,this.y+e.y)}times(e){return new t(this.x*e,this.y*e)}}function i(e){return{ball_position:new t(0,0),ball_velocity:new t(0,e.ball_initial_speed),player_paddle_x:0,ai_paddle_x:0,...e}}function l(e){return e.ball_position.y-e.ball_radius<-1?"player":e.ball_position.y+e.ball_radius>1?"ai":null}function a(e,i,l,a,n,o,d,s){let r=o-.5*s,_=o+.5*s,h=l.clamp(new t(n-.5*d,r),new t(n+.5*d,_));if(!(l.distance_squared_to(h)<e*e))return{position:l,velocity:a};let p=a.y<0?_+e+.001:r-e-.001,u=a.normalized();u.y*=-1;let c=Math.abs((l.y-p)/u.y),y=l.plus(u.times(c)),x=.5*Math.PI-(y.x-n)/(.5*d)*i;return{position:y,velocity:new t(Math.cos(x),-Math.sign(a.y)*Math.sin(x)).times(a.magnitude())}}window.addEventListener("DOMContentLoaded",function(){let n=document.getElementById("demo-canvas");if(!(n instanceof HTMLCanvasElement))throw Error("cannot find canvas");let o=n.getContext("2d",{alpha:!1});if(null===o)throw Error("cannot get context");let d={ball_radius:.05,ball_initial_speed:1.6,ball_max_bounce_angle:.3*Math.PI,paddle_width:.4,paddle_height:.05,ai_movement_speed:1},s="white",r="#ed12a5",_=i(d),h=null;n.addEventListener("mousemove",e=>{e.preventDefault(),_.player_paddle_x=-1+e.offsetX/n.clientWidth*2}),n.addEventListener("touchmove",e=>{let t=e.touches.item(0);if(null===t)return;e.preventDefault();let i=n.getBoundingClientRect();_.player_paddle_x=-1+(t.clientX-i.left)/n.clientWidth*2});let p=()=>{var n;let u=performance.now(),c=h?(u-h)/1e3:0;(h=u,n=_=function(i,n){var o,d;if(null!==l(i))return i;let{ball_radius:s,ball_max_bounce_angle:r,paddle_width:_,paddle_height:h,ai_movement_speed:p}=i,u={position:i.ball_position.plus(i.ball_velocity.times(n)),velocity:i.ball_velocity};return u=a(s,r,u.position,u.velocity,i.player_paddle_x,1-.5*i.paddle_height,_,h),o=(u=a(s,r,u.position,u.velocity,i.ai_paddle_x,-1+.5*i.paddle_height,_,h)).position,d=u.velocity,u=o.x-s<-1?{position:new t(-1+s,o.y),velocity:new t(-1*d.x,d.y)}:o.x+s>1?{position:new t(1-s,o.y),velocity:new t(-1*d.x,d.y)}:{position:o,velocity:d},{...i,ball_position:u.position,ball_velocity:u.velocity,ai_paddle_x:i.ai_paddle_x+n*function(t,i,l,a,n,o,d,s,r){let _;if(a.y>=0)return 0;let h=Math.sign(a.y),p=Math.sign(a.x),u=(Math.abs(h-l.y)-s-t)/Math.abs(a.y),c=Math.abs(a.x*u),y=Math.abs(p-l.x)-t;if(c<y)_=l.x+a.x*u;else{let e=2-2*t,i=Math.floor((c-y)/e),l=(c-y)%e;_=i%2==0?p-Math.sign(a.x)*l:-p+Math.sign(a.x)*l}let x=Math.atan((-Math.sign(n)*(1-t)-_)/2);return r*(_-.5*e(x/i,-1,1)*d-o)}(s,r,u.position,u.velocity,i.player_paddle_x,i.ai_paddle_x,_,h,p)}}(_,c),o.fillStyle=s,o.fillRect(0,0,o.canvas.width,o.canvas.height),o.save(),o.scale(o.canvas.width/2,o.canvas.height/2),o.translate(1,1),o.fillStyle=r,o.beginPath(),o.rect(n.player_paddle_x-.5*n.paddle_width,1-n.paddle_height,n.paddle_width,n.paddle_height),o.rect(n.ai_paddle_x-.5*n.paddle_width,-1,n.paddle_width,n.paddle_height),o.arc(n.ball_position.x,n.ball_position.y,n.ball_radius,0,2*Math.PI),o.fill(),o.restore(),null!==l(_))?("player"===l(_)&&d.ball_initial_speed<3&&(d.ball_initial_speed+=.2,d.ai_movement_speed+=.2),_=i(d),h=null,setTimeout(()=>requestAnimationFrame(p),1e3)):requestAnimationFrame(p)};p()})}();
//# sourceMappingURL=index.7d9d2a77.js.map