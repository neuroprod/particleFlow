


import ColorAttachment from "./textures/ColorAttachment";
import Texture from "./textures/Texture.ts";
import RenderTexture from "./textures/RenderTexture.ts";
import {Vector2} from "math.gl";
import UI from "./UI/UI.ts";
import Material from "./core/Material.ts";
import Model from "./model/Model.ts";
import UniformGroup from "./core/UniformGroup.ts";


export default class Renderer {
    public device: GPUDevice;

    public ratio: number=1;

    presentationFormat: GPUTextureFormat;

    canvas: HTMLCanvasElement;
    public width: number = 1;
    public height: number = 1;
    public size =new Vector2(1,1);

    commandEncoder: GPUCommandEncoder;
    private context: GPUCanvasContext;

    private canvasColorAttachment: ColorAttachment;
    private canvasTextureView: GPUTexture;
    private first: boolean = true;

    public pixelRatio: number;

    public texturesByLabel: { [label: string]: Texture } = {};
    public textures: Array<Texture> = [];
    private scaleToCanvasTextures: Array<RenderTexture> = [];


    private materials: Array<Material> = [];

    models: Array<Model> = [];
    public modelByLabel: { [label: string]: Model } = {};
    public modelLabels:Array<string>=[];

    private uniformGroups: Array<UniformGroup> = [];


    constructor() {
    }

    async setup(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const adapter = await navigator.gpu.requestAdapter({powerPreference:"high-performance"});
        //--enable-dawn-features=allow_unsafe_apis
        // on mac: /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --enable-dawn-features=allow_unsafe_apis
        this.pixelRatio = window.devicePixelRatio;

        const requiredFeatures: Array<GPUFeatureName> = ["rg11b10ufloat-renderable","float32-filterable"];
        if (adapter.features.has('timestamp-query')) {
          /* if(UIData.useTimestamp) {
               requiredFeatures.push('timestamp-query');
               this.useTimeStampQuery = true;
           }*/

        }
        //TEXTURE_ADAPTER_SPECIFIC_FORMAT_FEATURES
      //  console.log(adapter.limits)
        //extentions
        for (let a of adapter.features.keys()) {
        console.log(a)
        }
        //console.log("timestamps?", this.useTimeStampQuery)
        //let limits={
          //  maxUniformBufferBindingSize: Math.pow(2,18)
        //} //=adapter.limits
        //limits.maxUniformBufferBindingSize = limits.maxUniformBufferBindingSize*2

        this.device = await adapter.requestDevice({requiredFeatures: requiredFeatures});

        this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.presentationFormat,
            alphaMode: "premultiplied",

        });


        //this.ratio = this.canvas.width / this.canvas.height;
    }



    public setCanvasColorAttachment(canvasColorAttachment: ColorAttachment) {
        this.canvasColorAttachment = canvasColorAttachment
    }

    public update(setCommands: () => void) {

        this.updateSize();
        this.updateModels();
        this.updateUniformGroups();
        UI.updateGPU();
        //

        this.canvasTextureView = this.context.getCurrentTexture();

        this.first = false;
        this.canvasColorAttachment.setTarget(this.canvasTextureView.createView())


        this.commandEncoder = this.device.createCommandEncoder();



        setCommands();


        this.device.queue.submit([this.commandEncoder.finish()]);


    }
    addScaleToCanvasTexture(texture: RenderTexture) {
        this.scaleToCanvasTextures.push(texture);
    }
    addTexture(texture: Texture) {
        this.textures.push(texture);
        this.texturesByLabel[texture.label] = texture;
    }
    addUniformGroup(uniformGroup: UniformGroup) {
        this.uniformGroups.push(uniformGroup)
    }
    addModel(model: Model) {
        this.models.push(model)
        this.modelByLabel[model.label]=model;
        this.modelLabels.push(model.label);
    }

    addMaterial(material: Material) {
        this.materials.push(material)
    }
    private updateUniformGroups() {
        for (let u of this.uniformGroups) {
            u.update()
        }
    }
    updateModels() {
        for (let m of this.models) {
            m.update();
        }
    }
    private updateSize() {

        if (this.width != this.canvas.width || this.height != this.canvas.height) {
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            this.ratio = this.width / this.height;
            this.size.x =this.width;
            this.size.y =this.height;
            for (let t of this.scaleToCanvasTextures) {
                if(t.label=="canvasColor" || t.label=="canvasDepth"){
                    t.resize(this.width, this.height);
                }else{
                    t.resize(this.width/this.pixelRatio, this.height/this.pixelRatio);
                }
            }

            for (let t of this.scaleToCanvasTextures) {
                t.make()

            }
        }

    }
}

