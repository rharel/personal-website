function e(e,t){return e+Math.floor(Math.random()*(t-e+1))}window.addEventListener("DOMContentLoaded",function(){let t=document.getElementById("demo-image");t instanceof HTMLInputElement&&(t.addEventListener("change",()=>(function(t){if(null===t.files||1!==t.files.length)return;let n=t.files.item(0);if(null===n)return;let a=new Image;a.src=URL.createObjectURL(n),a.addEventListener("load",()=>{let t=document.querySelectorAll(".demo-palette-color"),n=t.length,l=Math.ceil(Math.min(a.naturalWidth,a.naturalHeight)/20),r=(function(t,n,a){let l=document.createElement("canvas");l.width=t.naturalWidth,l.height=t.naturalHeight;let r=l.getContext("2d");if(null===r)throw Error("cannot get canvas context");return r.drawImage(t,0,0,l.width,l.height),function(t,n,a){let l=[];for(let a=0;a<t.width-n;a+=n)for(let r=0;r<t.height-n;r+=n){let i=4*(e(a,a+n)+e(r,r+n)*t.width),o=t.data.slice(i,i+3);l.push([o[0],o[1],o[2]])}let r=l.map(e=>(function(e,t,n){let a=Math.max(e/=255,t/=255,n/=255),l=Math.min(e,t,n),r=0,i=0,o=(a+l)/2;if(a===l)r=0,i=0;else{let h=a-l;switch(i=o>.5?h/(2-a-l):h/(a+l),a){case e:r=(t-n)/h+(t<n?6:0);break;case t:r=(n-e)/h+2;break;case n:r=(e-t)/h+4}r/=6}return[r,i,o]})(e[0],e[1],e[2])),i=[];for(let t=0;t<a;t+=1){let t=e(0,r.length-1);i.push(r[t])}return(function(e,t,n,a){let l=JSON.parse(JSON.stringify(n)),r=Array(e.length).fill(-1),i=Array(t).fill(0),o=!0;for(;o;)i.fill(0),o=!1,e.forEach((e,n)=>{let h=0,c=a(e,l[0]);for(let n=1;n<t;++n){let t=a(e,l[n]);t<c&&(c=t,h=n)}(-1===r[n]||r[n]!==h)&&(o=!0),r[n]=h,i[h]+=1}),o&&(l.forEach(e=>e.fill(0)),e.forEach((e,t)=>{let n=r[t],a=i[n],o=l[n];o.forEach((t,n)=>o[n]+=e[n]/a)}));return l.map((e,t)=>({mean:e,size:i[t]})).filter(e=>e.size>0)})(r,a,i,function(e,t){return(e[0]-t[0])*(e[0]-t[0])+(e[1]-t[1])*(e[1]-t[1])+(e[2]-t[2])*(e[2]-t[2])}).sort((e,t)=>t.size-e.size).map(e=>(function(e,t,n){function a(e,t,n){return(n<0&&(n+=1),n>1&&(n-=1),n<1/6)?e+(t-e)*6*n:n<.5?t:n<2/3?e+(t-e)*(2/3-n)*6:e}let l=0,r=0,i=0;if(0===t)l=n,r=n,i=n;else{let o=n<.5?n*(1+t):n+t-n*t,h=2*n-o;l=a(h,o,e+1/3),r=a(h,o,e),i=a(h,o,e-1/3)}return[Math.max(Math.min(256*l,255),0),Math.max(Math.min(256*r,255),0),Math.max(Math.min(256*i,255),0)]})(e.mean[0],e.mean[1],e.mean[2]))}(r.getImageData(0,0,l.width,l.height),n,a)})(a,l,n).map(e=>e.map(Math.round));for(let e=0;e<t.length;e+=1)t.item(e).style.removeProperty("background-color");for(let e=0;e<r.length;e+=1){let n=r[e],a=t.item(e);a.style.backgroundColor=`rgb(${n[0]}, ${n[1]}, ${n[2]})`,a.setAttribute("aria-label",`Colored square: rgb(${n[0]}, ${n[1]}, ${n[2]})`)}})})(t)),document.getElementById("demo-select-image-button")?.addEventListener("click",()=>t.click()))});
//# sourceMappingURL=index.cb802b4f.js.map
