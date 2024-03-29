import CanvasManager from "./lib/CanvasManager.ts";
import Renderer from "./lib/Renderer.ts";
import UI from "./lib/UI/UI.ts";
import CanvasRenderPass from "./CanvasRenderPass.ts";
import Camera from "./lib/Camera.ts";
import Model from "./lib/model/Model.ts";
import Sphere from "./lib/mesh/Sphere.ts";
import Material from "./lib/core/Material.ts";
import ParticleShader from "./ParticleShader.ts";



export default class Main{
    private canvasManager: CanvasManager;

    private renderer: Renderer;
    private canvas: HTMLCanvasElement;
    private canvasRenderPass: any;
private camera
    private model: Model;

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
        this.model.mesh =new Sphere(this.renderer)
        this.model.material =new Material(this.renderer,"modelMat",new ParticleShader(this.renderer,"particleShader"))
        this.canvasRenderPass.modelRenderer.addModel(this.model)


        this.tick()

    }
    tick() {

        window.requestAnimationFrame(() => this.tick());
        UI.pushWindow("Settings");
        UI.LButton("test");
        UI.popWindow();

        this.camera.ratio =this.renderer.ratio

        this.renderer.update(this.onDraw.bind(this));
    }
    onDraw(){
        this.canvasRenderPass.add();

    }
}
