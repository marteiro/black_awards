import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import Card from './Card.js';
import cardLoader from './cardLoader.js'

var clock;
var reality, fantasy, mask, camera, renderer, controls;
let c=new Card();

let toAnimate=true;

async function init(loadedData) {

    reality = new THREE.Scene();
    fantasy = new THREE.Scene();
    mask = new THREE.Scene();

    // create fog

    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 10000);
    camera.position.z = 1.3;
    renderer = new THREE.WebGLRenderer({antialias:true});

    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x888888);

    renderer.autoClear = false;
    controls = new OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    let back=await cardLoader('./assets/back.svg',{
        fit:{w:1, h:10},
        depths:false
    });
    let frame=await cardLoader('./assets/frame-01.svg',{
        fit:{w:1, h:10},
        depths:false
    });
    let carta=await cardLoader('./assets/carta3.svg',{
        fit:{w:.94, h:100},
        depths:true
    });
    let maskShape=await cardLoader('./assets/mask.svg',{
        fit:{w:358/462, h:100},
        depths:false
    });
    
    back.rotateY(0);
    frame.rotateY(Math.PI);
    carta.rotateY(Math.PI);
    maskShape.rotateY(Math.PI);
    
    reality.add(back)
    reality.add(frame)
    fantasy.add(carta)
    mask.add(maskShape)

    // window.back=back;
    // animate()
    controls.addEventListener("change", (e)=>{
        toAnimate=true;
    });
    animationLoopCheck();
}

function animationLoopCheck(){
    requestAnimationFrame(animationLoopCheck);
    if(toAnimate){
        toAnimate=false;
        animateMasked();
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.clear();
    renderer.render(fantasy, camera)
}

function animateMasked() {
    // requestAnimationFrame(animateMasked);
    controls.update();
    renderer.clear();

    var gl = renderer.getContext();
    window.gl=gl;

    renderer.render(reality, camera)

    // enable stencil test
    gl.enable(gl.STENCIL_TEST);
    //renderer.state.setStencilTest( true );

    // config the stencil buffer to collect data for testing
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

    // render shape for stencil test
    renderer.render(mask, camera);

    // set stencil buffer for testing
    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    // render actual scene
    renderer.render(fantasy, camera);

    // disable stencil test
    gl.disable(gl.STENCIL_TEST);
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

init();