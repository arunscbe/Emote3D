import * as THREE from './libs/three.module.js';
 import { GLTFLoader } from './libs/GLTFLoader.js';
import {OrbitControls} from './libs/OrbitControls.js';
// import {onWindowResize} from './resize.js'
let init, modelLoad;
let gltfpath = "assets/Floor.glb";
let texLoader = new THREE.TextureLoader();
let arrayObjects = [];
let raycaster = new THREE.Raycaster(),mouse = new THREE.Vector2(),SELECTED;
let _Player , _collider=[] ;

$(document).ready(function () {
    let detect = detectWebGL();
    if (detect == 1) {
        init = new sceneSetup(70, 1, 100, 2, 4, 2);
        modelLoad = new objLoad();
         modelLoad.Model();
        init.renderer.domElement.addEventListener('pointerdown', onDocumentMouseDown, true);
    } else if (detect == 0) {
        alert("PLEASE ENABLE WEBGL IN YOUR BROWSER....");
    } else if (detect == -1) {
        alert(detect);
        alert("YOUR BROWSER DOESNT SUPPORT WEBGL.....");
    }



});
function detectWebGL() {
    // Check for the WebGL rendering context
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
            names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
            context = false;

        for (var i in names) {
            try {
                context = canvas.getContext(names[i]);
                if (context && typeof context.getParameter === "function") {
                    // WebGL is enabled.
                    return 1;
                }
            } catch (e) { }
        }

        // WebGL is supported, but disabled.
        return 0;
    }

    // WebGL not supported.
    return -1;
};
let material = {
    cube: new THREE.MeshLambertMaterial({
        //   map:THREE.ImageUtils.loadTexture("assets/Road texture.png"),
        color: 0xffff00,
        combine: THREE.MixOperation,
        side: THREE.DoubleSide
    }),
}
class sceneSetup {
    constructor(FOV, near, far, x, y, z, ambientColor) {
        this.container = document.getElementById("canvas");
        this.scene = new THREE.Scene();
        this.addingCube();
        this.camera(FOV, near, far, x, y, z);
        this.ambientLight(ambientColor);
        this.render();

    }
    camera(FOV, near, far, x, y, z) {
        this.cameraMain = new THREE.PerspectiveCamera(FOV, this.container.offsetWidth / this.container.offsetHeight, near, far);
        this.cameraMain.position.set(x, y, z);
        // this.cameraMain.lookAt(this.camPoint);
        this.cameraMain.lookAt(0, 0, 0);
        this.scene.add(this.cameraMain);
        this.rendering();
    }
    rendering() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(0xffff00);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);
        // this.controls = new OrbitControls(this.cameraMain, this.renderer.domElement);
        // this.controls.minDistance = 100;
        // this.controls.maxDistance = 300;
        // this.controls.maxPolarAngle = Math.PI / 2 * 115 / 120;
        // this.controls.minPolarAngle = 140 / 120;
        // this.controls.minAzimuthAngle = -280 / 120;
        // this.controls.maxAzimuthAngle = -115 / 120;
        // this.controls.target = new THREE.Vector3(this.camPoint.position.x, this.camPoint.position.y, this.camPoint.position.z);
    }
    addingCube() {
        this.geo = new THREE.BoxBufferGeometry(.001, .001, .001);
        this.mat = material.cube;
        this.camPoint = new THREE.Mesh(this.geo, this.mat);
        this.scene.add(this.camPoint);
        this.camPoint.position.set(0, 0, 0);
        

    }
    ambientLight(ambientColor) {
        this.ambiLight = new THREE.AmbientLight(0xffffff);
        this.light = new THREE.HemisphereLight(0xd1d1d1, 0x080820, 1);
         this.scene.add(this.ambiLight);
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        // this.controls.update();
        
        //CAMERA MOVE
        let relativeCameraOffset = new THREE.Vector3(2, 4, 2);
        let cameraOffset = relativeCameraOffset.applyMatrix4(this.camPoint.matrixWorld);
        this.cameraMain.position.x = cameraOffset.x;
        this.cameraMain.position.y = cameraOffset.y;
        this.cameraMain.position.z = cameraOffset.z;
        this.cameraMain.lookAt(this.camPoint.position.x, this.camPoint.position.y, this.camPoint.position.z);

        this.renderer.render(this.scene, this.cameraMain);
        if(_Player){
            _menuColliders(_Player);
        }
        
    }
    render() {
        this.animate();
    }
}
const _menuColliders = (player) => {
    const pos = player.position.clone();
    let dir = new THREE.Vector3();
    let raycaster = new THREE.Raycaster(pos, dir);
    player.getWorldDirection(dir);
    if (_collider != undefined) {
        dir.set(0, -1, 0);
        raycaster = new THREE.Raycaster(pos, dir);
        let intersect = raycaster.intersectObjects(_collider);
        if (intersect.length > 0) {
            // console.log('INTERSECTED--->', intersect[0].object.name);
        }
    }
}
const onWindowResize=()=> {
    init.cameraMain.aspect = init.container.offsetWidth / init.container.offsetHeight;
    init.renderer.setSize(init.container.offsetWidth, init.container.offsetHeight);
    init.cameraMain.updateProjectionMatrix();
}

window.addEventListener('resize', onWindowResize, false);

const onDocumentMouseDown = (event) => {
    event.preventDefault();
    const rect = init.renderer.domElement.getBoundingClientRect();        
    mouse.x = ( ( event.clientX - rect.left ) / ( rect.right - rect.left ) ) * 2 - 1;
    mouse.y = - ( ( event.clientY - rect.top ) / ( rect.bottom - rect.top) ) * 2 + 1;
    raycaster.setFromCamera( mouse, init.cameraMain );
    let intersects = raycaster.intersectObjects( arrayObjects,true );
    if ( intersects.length > 0 ) {
        SELECTED = intersects[ 0 ].point;
        playerMove(SELECTED);	
    }
}
const playerMove = (data) =>{
    TweenMax.to(init.camPoint.position,2,{x:data.x, y:.2, z:data.z,onUpdate:function(){}});
    TweenMax.to(_Player.position,2,{x:data.x, y:.2, z:data.z,onUpdate:function(){
        // console.log('moving.....');
    },onComplete:()=>{
        // console.log('Completed.....');
    }});
}
const textureLoad = (tex) => {
    let _Tex = texLoader.load(tex,()=>{
        _Tex.wrapS = _Tex.wrapT = THREE.RepeatWrapping;
        _Tex.offset.set( 0, 0 );
        _Tex.repeat.set( 16, 16 );
    });
    return _Tex;
}
class objLoad {
    constructor() {

    }

    Model() {
        this.loader = new GLTFLoader();
        this.loader.load(gltfpath, gltf => {            
            this.mesh = gltf.scene;
            this.mesh.traverse((child)=>{
                if(child.type === 'Mesh'){
                    if(child.name.includes('Floor')){
                        child.material = new THREE.MeshBasicMaterial({
                            map : textureLoad('tex/floor.jpg'),
                        })
                        arrayObjects.push(child);
                    }else if(child.name.includes('Player')){
                        _Player = child;
                    }else if(child.name.includes('Content')){
                        child.material = new THREE.MeshBasicMaterial({
                            map :  texLoader.load('tex/content.png'),
                            transparent:true,
                        })
                    }
                    else if(child.name.includes('Service')){
                                child.material = new THREE.MeshBasicMaterial({
                                    map :  texLoader.load('tex/Services.png'),
                                    transparent:true,
                                })
                                _collider.push(child);
                    }else if(child.name.includes('AboutUs')){
                        child.material = new THREE.MeshBasicMaterial({
                            map :  texLoader.load('tex/AboutUS.png'),
                            transparent:true,
                        })
                        _collider.push(child);
                    }
                    else if(child.name.includes('ContactUs')){
                        child.material = new THREE.MeshBasicMaterial({
                            map :  texLoader.load('tex/Contactus.png'),
                            transparent:true,
                        })
                        _collider.push(child);
                    }
                    else if(child.name.includes('Home')){
                        child.material = new THREE.MeshBasicMaterial({
                            map :  texLoader.load('tex/Home.png'),
                            transparent:true,
                        })
                        _collider.push(child);
                    }
                    else if(child.name.includes('Products')){
                        child.material = new THREE.MeshBasicMaterial({
                            map :  texLoader.load('tex/Products.png'),
                            transparent:true,
                        })
                        _collider.push(child);
                    }
                    
                }
            });
            this.mesh.position.set(0, 0, 0);
            init.scene.add(this.mesh);
        });
    }
}
