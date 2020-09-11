import { SVGLoader } from './three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from './three/build/three.module.js';

// layer list in order from back to front as shown in 3d
let props = {
    lista:[
        {
            layer:"bg3",
            depth: 1,
            depthWrite:true
        },{
            layer:"sky",
            depth: .8,
            depthWrite:true
        },{
            layer:"bg2",
            depth: .4,
            depthWrite:true
        },{
            layer:"bg1",
            depth: .1,
            depthWrite:true
        },{
            layer:"detail",
            depth: 0,
            depthWrite:true
        },{
            layer:"char",
            depth: -.08,
            depthWrite:false
        },{
            layer:"flat",
            depth: 0,
        },
    ],
    maxDist: 1.3,
    minDist: -1.5,
    fit:{
        w:1,
        h:1
    },
    depths:true
}

let dataHabdler = function (data) {
    const paths = data.paths;
    const group = new THREE.Group();
    const nodes = data.xml.querySelectorAll(":root>*[id]");

    const groups = [];

    const xmlSize={
        w:parseFloat(data.xml.attributes.width.value),
        h:parseFloat(data.xml.attributes.height.value)
    }
    
    let xmlScaleFit={
        w:props.fit.w/xmlSize.w,
        h:props.fit.h/xmlSize.h
    }

    xmlScaleFit.min=Math.min(xmlScaleFit.w, xmlScaleFit.h)
    xmlScaleFit.max=Math.max(xmlScaleFit.w, xmlScaleFit.h)


    for (let i = 0; i < paths.length; i++) {
        let targetGroup = group;

        const path = paths[i];
        const parentId = path.userData.node.parentNode.getAttribute("id");
        const index = props.lista.findIndex(item => item.layer === parentId);
        const myData=props.lista[index] || {};

        if (index == -1) {
            // console.log(path.userData.node)
        } else {
            if (groups[parentId] == undefined) {
                groups[parentId] = new THREE.Group();
                groups[parentId].userData.myId = parentId
            }
            targetGroup = groups[parentId];
            // console.log(path.userData.node.parentNode.getAttribute("id")) 
        }

        const material = new THREE.MeshBasicMaterial({
            color: path.color,
            colorWrite: true,  // works for r73 (not r70)
            depthWrite: typeof myData.depthWrite=="boolean" ? myData.depthWrite : false
        });

        console.log(material.depthWrite)

        let shapes = path.toShapes(true);

        for (let j = 0; j < shapes.length; j++) {
            const shape = shapes[j];
            const geometry = new THREE.ShapeBufferGeometry(shape);
            geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(-xmlSize.w/2, -xmlSize.h/2, 0));
            geometry.applyMatrix4(new THREE.Matrix4().makeScale ( -xmlScaleFit.min, -xmlScaleFit.min, 0 )) 
            const mesh = new THREE.Mesh(geometry, material);

            mesh.userData.myId = path.userData.node.getAttribute("id");

            targetGroup.add(mesh);
        }

        if (targetGroup != group) {
            group.add(targetGroup)
        }
    }
    return group;
}

let createLayers = function (group) {
    const box = new THREE.Box3().setFromObject(group);
    const center=new THREE.Vector3();
    const factor = 1 / box.max.x * 1;
    const pos = box.getCenter(center).multiplyScalar(factor, factor, factor);

    const aspect=window.innerWidth / window.innerHeight;
    const valor=Math.tan((75)/2/180*Math.PI)*10*2;

    group.children.forEach((item, i) => {
        const myData = props.lista.find(listItem => listItem.layer === item.userData.myId);
        const pos= -myData.depth;
        const scalefac = 1 + (-pos / props.maxDist)

        item.position.z = pos;
        
        item.scale.set(scalefac, scalefac, 0);
        item.position.x *= scalefac;
        item.position.y *= scalefac;
    })

    return group;
}

export default async function cardLoader(svgPath, properties) {

    if(typeof properties=="object"){
        props={...props, ...properties}
    }

    let loader = new SVGLoader();
    
    return new Promise(resolve => {
        loader.load(svgPath,
            // on success
            loadedData => {
                let loadedCard=dataHabdler(loadedData);
                loadedCard = props.depths ? createLayers(loadedCard) : loadedCard;
                resolve(loadedCard);
            },

            // on progress
            progressData => {
                // console.log(progressData)
            },

            // on progress
            errorData => {
                // console.log(errorData)
            }
        );
    });
}