import CanvasManager from "./lib/CanvasManager.ts";
import Renderer from "./lib/Renderer.ts";
import UI from "./lib/UI/UI.ts";
import CanvasRenderPass from "./CanvasRenderPass.ts";
import Camera from "./lib/Camera.ts";
import Model from "./lib/model/Model.ts";
import Sphere from "./lib/mesh/Sphere.ts";
import Material from "./lib/core/Material.ts";
import ParticleShader from "./ParticleShader.ts";
import Compute from "./Compute.ts";
import Timer from "./lib/Timer.ts";



export default class Main{
    private canvasManager: CanvasManager;

    private renderer: Renderer;
    private canvas: HTMLCanvasElement;
    private canvasRenderPass: any;
    private camera
    private model: Model;
    private bufferPosA: GPUBuffer;
    private bufferPosB: GPUBuffer;

    private bufferSpeedA: GPUBuffer;
    private bufferSpeedB: GPUBuffer;


    private pingPong =0;
    private compute: Compute;
    private byteLength: number;

    constructor() {
        console.log("setup");
        this.canvas = document.getElementById("webgpuCanvas") as HTMLCanvasElement
        this.canvasManager = new CanvasManager(this.canvas);
        this.renderer = new Renderer()

        this.renderer.setup(this.canvas).then(() => {
            this.setup();
        }).catch(() => {
           console.error("noWebgpu")
        })
    }

    setup() {
        this.canvasRenderPass = new CanvasRenderPass(this.renderer);
        this.renderer.setCanvasColorAttachment(this.canvasRenderPass.canvasColorAttachment)

        UI.setWebGPU(this.renderer)

        this.camera =new Camera(this.renderer,"mainCamera")
        this.canvasRenderPass.modelRenderer.camera =this.camera

        this.model = new Model(this.renderer,"partModel")
        this.model.mesh =new Sphere(this.renderer,0.1,5,3)
        this.model.material =new Material(this.renderer,"modelMat",new ParticleShader(this.renderer,"particleShader"))
        this.makePositions()

        this.canvasRenderPass.modelRenderer.addModel(this.model)
        this.compute = new Compute(this.renderer,this.bufferPosA,this.bufferPosB,this.bufferSpeedA,this.bufferSpeedB,this.byteLength)

        this.tick()

    }
    tick() {

        window.requestAnimationFrame(() => this.tick());
        Timer.update()
        UI.pushWindow("Settings");
        UI.LButton("test");
        UI.popWindow();

        this.camera.ratio =this.renderer.ratio

        this.pingPong++;
        if(this.pingPong%2==0){
            this.model.addBuffer("aInstancePos",this.bufferPosA)
        }else{
            this.model.addBuffer("aInstancePos",this.bufferPosB)

        }
        this.compute.uniformGroup.setUniform("time",Timer.time)


        this.renderer.update(this.onDraw.bind(this));
    }
    onDraw(){

        this.compute.add(this.pingPong,this.model.numInstances)
        this.canvasRenderPass.add();

    }
    private makePositions() {
        this.model.numInstances =500000;


        let data =new Float32Array( this.model.numInstances*4)
        this.byteLength   =data.byteLength
        let index =0;
        let y =0;
        for(let i=0;i<this.model.numInstances;i++ ){

        let x = i%1000
            if(x==0) y++;
            data[index++]=(x/1000-0.5)*40;
            data[index++]=0;
            data[index++]=(y/1000 -0.5)*20;
            data[index++]=Math.random();

        }



        this.bufferPosA= this.renderer.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        const dst = new Float32Array(this.bufferPosA.getMappedRange());
        dst.set(data);

        this.bufferPosA.unmap();
        this.bufferPosA.label = "instanceBufferA" ;
        this.model.addBuffer("aInstancePos",this.bufferPosA)



        this.bufferPosB= this.renderer.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX| GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        const dstB = new Float32Array(this.bufferPosB.getMappedRange());
        dstB.set(data);

        this.bufferPosB.unmap();
        this.bufferPosB.label = "instanceBufferB" ;



        let dataSpeed =new Float32Array( this.model.numInstances*4)

        index =0;
        for(let i=0;i<this.model.numInstances;i++ ){



            dataSpeed[index++]=Math.random()*0.1;
            dataSpeed[index++]=(Math.random()-0.5)*0.01;
            dataSpeed[index++]=(Math.random()-0.5)*0.01;
            dataSpeed[index++]=Math.random();

        }


        this.bufferSpeedA= this.renderer.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX|GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        const dstS = new Float32Array(this.bufferSpeedA.getMappedRange());
        dstS.set(dataSpeed);

        this.bufferSpeedA.unmap();
        this.bufferSpeedA.label = "instanceBufferSpeedA" ;




        this.bufferSpeedB= this.renderer.device.createBuffer({
            size: data.byteLength,
            usage: GPUBufferUsage.VERTEX| GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        const dstSpeedB = new Float32Array(this.bufferSpeedB.getMappedRange());
        dstSpeedB.set(dataSpeed);

        this.bufferSpeedB.unmap();
        this.bufferSpeedB.label = "instanceBufferSpeedB" ;


    }
}
