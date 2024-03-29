import CanvasManager from "./lib/CanvasManager.ts";
import Renderer from "./lib/Renderer.ts";
import UI from "./lib/UI/UI.ts";
import CanvasRenderPass from "./CanvasRenderPass.ts";



export default class Main{
    private canvasManager: CanvasManager;

    private renderer: Renderer;
    private canvas: HTMLCanvasElement;
    private canvasRenderPass: any;


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
        this.tick()

    }
    tick() {

        window.requestAnimationFrame(() => this.tick());
        UI.pushWindow("Settings");
        UI.LButton("Clear local storage");
        UI.popWindow();



        this.renderer.update(this.onDraw.bind(this));
    }
    onDraw(){
        this.canvasRenderPass.add();

    }
}
