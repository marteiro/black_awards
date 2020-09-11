import * as THREE from './three/build/three.module.js';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
import { SVGLoader } from './three/examples/jsm/loaders/SVGLoader.js';

var scene, sceneStencil, camera, cameraFixa, renderer, clock;
var controls;
var box, plane;
var loader = new SVGLoader();

var obj;

var maxDist=4;
var minDist=-1.5;

// var loader = new THREE.SVGLoader();



loader.load('./assets/carta3.svg', parseSvg, (data) => { console.log(data) }, (e) => { console.log(e) })

function parseSvg(data) {
    var paths = data.paths;
    var group = new THREE.Group();

    //bg3, bg2, bg1, detail, sky, char
    let lista="bg3 sky bg2 bg1 detail char".split(" ")

    let nodes=data.xml.querySelectorAll(":root>*[id]");

    let groups=[];

    for (var i = 0; i < paths.length; i++) {
        
        let targetGroup=group;

        var path = paths[i];
        var parentId=path.userData.node.parentNode.getAttribute("id");
        
        if(lista.indexOf(parentId)==-1){
            // console.log(path.userData.node)
        }else{
            if(groups[parentId]==undefined){
                groups[parentId] = new THREE.Group();
                groups[parentId].userData.myId=parentId
            }
            targetGroup=groups[parentId];
            // console.log(path.userData.node.parentNode.getAttribute("id")) 
        }

        var material = new THREE.MeshBasicMaterial({
            color: path.color,
            // side: THREE.DoubleSide,
            // depthWrite: false
        });

        var shapes = path.toShapes(true);

        for (var j = 0; j < shapes.length; j++) {

            var shape = shapes[j];
            var geometry = new THREE.ShapeBufferGeometry(shape);
            var mesh = new THREE.Mesh(geometry, material);

            mesh.userData.myId=path.userData.node.getAttribute("id")
            
            targetGroup.add(mesh);
        }

        if(targetGroup!=group){
            group.add(targetGroup)
        }
    }
    
    

    var box = new THREE.Box3().setFromObject(group);
    let factor=1/box.max.x*1;
    let pos=box.getCenter().multiplyScalar(factor,factor,factor);

    // let aspect=window.innerWidth / window.innerHeight;
    // var valor=Math.tan((75)/2/180*Math.PI)*10*2;
    
    group.children.forEach((mesh)=>{
        if(mesh.geometry){
            mesh.geometry.scale(factor,factor,factor)
            mesh.position.sub(pos)
        }else if (mesh.children){
            mesh.children.forEach((mesh2=>{
                mesh2.geometry.scale(factor,factor,factor)
                mesh2.position.sub(pos)
            }));
        }
    });

    group.children.forEach((item, i)=>{
        let myI=lista.indexOf(item.userData.myId);
        let newI=Math.abs(myI-(group.children.length-1));
        let pos=-(1*newI);

        console.log(pos)
        
        item.position.z=pos;
        let scalefac=1+(-pos/maxDist)
        item.scale.set(scalefac,scalefac,0);
        item.position.x*=scalefac;
        item.position.y*=scalefac;
    })

    obj=group;
    window.obj=obj

    init();
    animate();
    // animateNormal();
}

function init(loadedData) {
    var planeGeometry, planeMaterial;
    var boxGeometry, boxMaterial;
    var index;

    scene = new THREE.Scene();
    sceneStencil = new THREE.Scene();

    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 10000);
    cameraFixa = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 10000);
    
    camera.position.z = 10;
    cameraFixa.position.z = 10;

    // planeGeometry = new THREE.PlaneGeometry(1, (821.0/509.0));
    planeGeometry = new THREE.PlaneGeometry(5,8);

    // set colorWrite to "true" to see the area/shapes of the stencil test
    planeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        colorWrite: true,  // works for r73 (not r70)
        depthWrite: false
    });

    // for (index = 0; index < 5; index++) {
    //     plane = new THREE.Mesh(planeGeometry, planeMaterial);
    //     plane.position.x = -10 + (5 * index);
    //     sceneStencil.add(plane);
    // }
    plane = new THREE.Mesh(planeGeometry, planeMaterial);
    sceneStencil.add(plane);
    

    boxGeometry = new THREE.BoxGeometry(1,1, 0);
    boxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
    });

    box = new THREE.Mesh(boxGeometry, boxMaterial);
    // scene.add(box);
    scene.add(obj);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio ? window.devicePixelRatio : 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x888888);

    renderer.autoClear = false;
    controls = new OrbitControls(camera, renderer.domElement);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
}

function animateNormal(){
    renderer.clear();
    requestAnimationFrame( animateNormal );
    renderer.render( scene, camera );
}

function animate() {

    requestAnimationFrame(animate);
    controls.update();
    renderer.clear();

    let sinNormal=((Math.cos(clock.getElapsedTime()/2) + 1) / 2);

    let cameraPos=minDist + (sinNormal * (maxDist-minDist)) ;

    plane.position.z=4;

    // animate the box
    // box.position.x = Math.cos(clock.getElapsedTime()) * 10;
    cameraFixa.position.z= cameraPos;


    // cameraFixa.position.z=10;
    // console.log(cameraFixa.position.z)

    var gl = renderer.getContext();
    window.gl=gl;

    // enable stencil test
    gl.enable(gl.STENCIL_TEST);
    //renderer.state.setStencilTest( true );

    // config the stencil buffer to collect data for testing
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);

    // render shape for stencil test
    renderer.render(sceneStencil, camera);

    // set stencil buffer for testing
    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    // render actual scene
    renderer.render(scene, cameraFixa);

    // disable stencil test
    gl.disable(gl.STENCIL_TEST);
}

function onWindowResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    cameraFixa.aspect = window.innerWidth / window.innerHeight;
    cameraFixa.updateProjectionMatrix();
}

