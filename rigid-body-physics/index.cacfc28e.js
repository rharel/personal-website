!function(){class t{constructor(t,i){this.x=t,this.y=i}clone(){return new t(this.x,this.y)}assign(t){return this.x=t.x,this.y=t.y,this}normalize(){let t=1/this.length();return this.x*=t,this.y*=t,this}set_length(t){let i=t/this.length();return this.x*=i,this.y*=i,this}add(t){return this.x+=t.x,this.y+=t.y,this}subtract(t){return this.x-=t.x,this.y-=t.y,this}scale(t){return this.x*=t,this.y*=t,this}dot(t){return this.x*t.x+this.y*t.y}length_squared(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}distance_squared_to(t){let i=t.x-this.x,e=t.y-this.y;return i*i+e*e}}class i{constructor(t,i,e,s){this.top=t,this.left=i,this.width=e,this.height=s,this.bottom=this.top-this.height,this.right=this.left+this.width}static from_center_and_radius(t,e,s){return new i(e+s,t-s,s,s)}overlaps(t){return t.left<=this.right&&t.right>=this.left&&t.bottom<=this.top&&t.top>=this.bottom}}class e{constructor(t,s){if(this.depth=t,this.bounds=s,this.node={kind:"leaf",items:[]},this.depth<1)throw Error("quadtree node cannot have depth < 1");if(1===this.depth)this.node={kind:"leaf",items:[]};else if(this.depth>1){let s=t-1,o=this.bounds.top,n=this.bounds.left,l=.5*this.bounds.width,r=.5*this.bounds.height;this.node={kind:"internal",sw:new e(s,new i(o-r,n,l,r)),se:new e(s,new i(o-r,n+l,l,r)),nw:new e(s,new i(o,n,l,r)),ne:new e(s,new i(o,n+l,l,r))}}}nr_items(){if("leaf"===this.node.kind)return this.node.items.length;{let t=0;return this.for_each_child(i=>t+=i.nr_items()),t}}clear(){"leaf"===this.node.kind?this.node.items.length=0:this.for_each_child(t=>t.clear())}add(t,i){i.overlaps(this.bounds)&&("internal"===this.node.kind?this.for_each_child(e=>{e.bounds.overlaps(i)&&e.add(t,i)}):this.node.items.includes(t)||this.node.items.push(t))}remove(t,i){if(i.overlaps(this.bounds)){if("internal"===this.node.kind)this.for_each_child(e=>{e.bounds.overlaps(i)&&e.remove(t,i)});else if(this.node.items.includes(t)){let i=this.node.items.indexOf(t);this.node.items.splice(i,1)}}}for_each_child(t){"leaf"!==this.node.kind&&(t(this.node.sw),t(this.node.se),t(this.node.nw),t(this.node.ne))}for_each_leaf_with_at_least(t,i){this.nr_items()<t||("leaf"===this.node.kind?i(this.node.items):this.for_each_child(e=>e.for_each_leaf_with_at_least(t,i)))}}class s{constructor(t){this.options=t,this.quadtree=new e(t.subdivisions,new i(t.bounds_size,0,t.bounds_size,t.bounds_size))}clear(){this.quadtree.clear()}add(t){this.quadtree.add(t,i.from_center_and_radius(t.position.x,t.position.y,t.radius))}remove(t){this.quadtree.remove(t,i.from_center_and_radius(t.position.x,t.position.y,t.radius))}moved(t,e){let s=i.from_center_and_radius(e.x,e.y,t.radius),o=i.from_center_and_radius(t.position.x,t.position.y,t.radius);this.quadtree.remove(t,s),this.quadtree.add(t,o)}for_each_potential_collision_group(t){this.quadtree.for_each_leaf_with_at_least(2,i=>{t(i)})}}function o(t){let i=[];for(let l=0;l<t.length;++l){let r=t[l];for(let a=l+1;a<t.length;++a){let l=t[a];if(!r.static||!l.static){var e,s,o,n;if(e=r.position,s=r.radius,o=l.position,n=l.radius,e.distance_squared_to(o)<=(s+n)*(s+n)){i.push([r,l]);break}}}}return i}function n(t,i){if(t.static&&i.static)return;if(i.static){let e=t;t=i,i=e}let e=t.position.clone().subtract(i.position).set_length(t.radius+i.radius),s=t.velocity.clone().subtract(i.velocity),o=2*(.5*(t.elasticity+i.elasticity))*s.dot(e)/((t.mass+i.mass)*e.length_squared());t.static||t.velocity.subtract(e.clone().scale(o*i.mass)),i.static||i.velocity.subtract(e.clone().scale(-o*t.mass))}function l(t,i,e){if(t.static&&i.static)return;let s=t.radius+i.radius+e,o=t.position.distance_squared_to(i.position);if(o>=s*s)return;let n=t.position.clone().subtract(i.position).normalize(),l=s-Math.sqrt(o);t.static?i.position.add(n.scale(-l)):i.static?t.position.add(n.scale(l)):(t.position.add(n.clone().scale(.5*l)),i.position.add(n.clone().scale(-(.5*l))))}function r(t,i){let e=t.applied_force,s=1/t.mass,o=t.position,n=t.velocity,l=.5*i*s;o.x+=i*(n.x+l*e.x),o.y+=i*(n.y+l*e.y);let r=i*s;n.x+=r*e.x,n.y+=r*e.y}class a{constructor(t){this.options=t,this.next_entity_id=0,this.entities=new Map,this.collision_culler=new s({subdivisions:t.collision_culling_subdivisions,bounds_size:t.size})}clear(){this.collision_culler.clear(),this.entities.clear()}spawn(i){let e={mass:i.static?1e14:void 0!==i.mass?i.mass:1,radius:void 0!==i.radius?i.radius:1,elasticity:void 0!==i.elasticity?i.elasticity:0,static:void 0!==i.static&&i.static,position:void 0!==i.position?new t(i.position.x,i.position.y):new t(0,0),velocity:void 0!==i.velocity?new t(i.velocity.x,i.velocity.y):new t(0,0),applied_force:void 0!==i.applied_force?new t(i.applied_force.x,i.applied_force.y):new t(0,0)},s=this.next_entity_id;return this.next_entity_id+=1,this.entities.set(s,e),this.collision_culler.add(e),s}remove(t){if(!this.entities.has(t))throw Error("bad entity id");let i=this.entities.get(t);this.collision_culler.remove(i),this.entities.delete(t)}entity(t){if(!this.entities.has(t))throw Error("bad entity id");let i=this.entities.get(t);return{...i,position:{x:i.position.x,y:i.position.y},velocity:{x:i.velocity.x,y:i.velocity.y},applied_force:{x:i.applied_force.x,y:i.applied_force.y}}}update(t,i){if(!this.entities.has(t))throw Error("bad entity id");let e=this.entities.get(t),s=e.position.clone();void 0!==i.mass&&(e.mass=i.mass),void 0!==i.radius&&(e.radius=i.radius),void 0!==i.elasticity&&(e.elasticity=i.elasticity),void 0!==i.static&&(e.static=i.static,e.static&&(e.mass=1e14)),void 0!==i.position&&(e.position.x=i.position.x,e.position.y=i.position.y),void 0!==i.velocity&&(e.velocity.x=i.velocity.x,e.velocity.y=i.velocity.y),void 0!==i.applied_force&&(e.applied_force.x=i.applied_force.x,e.applied_force.y=i.applied_force.y),(void 0!==i.position||void 0!==i.radius)&&this.collision_culler.moved(e,s)}for_each_entity(t){this.entities.forEach((i,e)=>{t(e,this.entity(e))})}step(t){if(t<=0)throw Error("cannot step with dt <= 0");this.separate_colliding_entities(),this.options.high_precision?this.step_with_high_precision(t):this.step_with_low_precision(t),this.entities.forEach(t=>{.001>t.velocity.length_squared()&&(t.velocity.x=0,t.velocity.y=0)})}separate_colliding_entities(){let t=new Map;this.collision_culler.for_each_potential_collision_group(i=>{let e=o(i);for(;e.length>0;){for(let[i,s]of e)i.static||t.set(i,i.position.clone()),s.static||t.set(s,s.position.clone()),l(i,s,.001),n(i,s);e=o(i)}}),t.forEach((t,i)=>{this.collision_culler.moved(i,t)})}step_with_high_precision(t){let i=new Set,e=new Map;this.entities.forEach(t=>{e.set(t,t.position.clone())}),this.collision_culler.for_each_potential_collision_group(e=>{for(let t=0;t<e.length;++t)i.add(e[t]);this.step_entity_group(e,t)}),this.entities.forEach(e=>{i.has(e)||r(e,t)}),e.forEach((t,i)=>{this.collision_culler.moved(i,t)})}step_entity_group(t,i){let e=i;for(;e>.001;){let s=null;for(let i of function(t,i){let e=[];for(let s=0;s<t.length;++s){let o=t[s];for(let n=s+1;n<t.length;++n){let s=t[n];if(o.static&&s.static)continue;let l=function(t,i,e,s,o,n){let l=i.x-o.x,r=i.y-o.y,a=t.x-s.x,h=t.y-s.y,c=function(t,i,e){let s=i*i-4*t*e;return s<0?{count:0}:s>0?{count:2,x1:(-i+Math.sqrt(s))/(2*t),x2:(-i-Math.sqrt(s))/(2*t)}:{count:1,x1:-i/(2*t)}}(l*l+r*r,2*(a*l+h*r),a*a+h*h-(e+n)*(e+n));if(2===c.count){let[t,i]=c.x1<=c.x2?[c.x1,c.x2]:[c.x2,c.x1];return t<0&&i>=0?0:t}return 1===c.count?c.x1:-1}(o.position,o.velocity,o.radius,s.position,s.velocity,s.radius);0<=l&&l<=i&&e.push({entities:[o,s],time:l})}}return e}(t,e))(null===s||i.time<s.time)&&(s=i);let o=null!==s?s.time:i;for(let i of t)r(i,o);null!==s&&(n(s.entities[0],s.entities[1]),l(s.entities[0],s.entities[1],.001)),e-=o}}step_with_low_precision(t){this.entities.forEach(i=>{if(!i.static){let e=i.position.clone();r(i,t),this.collision_culler.moved(i,e)}})}}let h=["red","blue","brown","green","orange","magenta","purple"];function c(t,i){return t+Math.random()*(i-t)}window.addEventListener("DOMContentLoaded",function(){let i={},e=new a({size:1,collision_culling_subdivisions:3,high_precision:!0});for(let s=0;s<50;++s){let o=c(.012,.03),n=Math.PI*o*o;i[e.spawn({mass:n,radius:o,elasticity:.95,position:{x:c(o,e.options.size-o),y:c(o,e.options.size-o)},velocity:new t(c(-1,1),c(-1,1)).set_length(c(.1,.5))})]={fill:h[s%h.length]}}let s=document.getElementsByClassName("demo-canvas");if(1!==s.length)throw Error(`expected 1 demo canvas, found ${s.length}`);let o=s.item(0);if(!(o instanceof HTMLCanvasElement))throw Error(`expected canvas element, found ${typeof o}`);let n=o.getContext("2d",{alpha:!1});if(null===n)throw Error("cannot get rendering context");let l=function(t,i,e,s,o){let n=null,l=null;function r(){let a=performance.now(),h=null!==l?(a-l)/1e3:1/60;l=a,t.step(h),function(t,i,e,s){for(let o in i.save(),i.fillStyle=e,i.fillRect(0,0,i.canvas.width,i.canvas.height),i.translate(0,i.canvas.height),i.scale(1,-1),i.scale(i.canvas.width/t.options.size,i.canvas.height/t.options.size),s){let{fill:e}=s[o],n=t.entity(parseInt(o));i.beginPath(),i.arc(n.position.x,n.position.y,n.radius,0,2*Math.PI),i.fillStyle=e,i.fill()}i.restore()}(t,i,e,s),o&&o(),null!==n&&(n=requestAnimationFrame(r))}return n=requestAnimationFrame(r),{pause(){null!==n&&(cancelAnimationFrame(n),n=null,l=null)},resume(){null===n&&(l=performance.now(),n=requestAnimationFrame(r))}}}(e,n,"white",i,()=>{let t=0;e.for_each_entity((i,s)=>{let o=!1;s.position.x<s.radius&&(s.position.x=s.radius,s.velocity.x*=-1,o=!0),s.position.x>e.options.size-s.radius&&(s.position.x=e.options.size-s.radius,s.velocity.x*=-1,o=!0),s.position.y<s.radius&&(s.position.y=s.radius,s.velocity.y*=-1,o=!0),s.position.y>e.options.size-s.radius&&(s.position.y=e.options.size-s.radius,s.velocity.y*=-1,o=!0),o&&e.update(i,{position:s.position,velocity:s.velocity}),t+=s.velocity.x+s.velocity.y}),0===t&&l.pause()})})}();
//# sourceMappingURL=index.cacfc28e.js.map
