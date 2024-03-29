import RenderPass from "./lib/core/RenderPass.ts";
import ColorAttachment from "./lib/textures/ColorAttachment.ts";
import RenderTexture from "./lib/textures/RenderTexture.ts";
import Renderer from "./lib/Renderer.ts";
import {TextureFormat} from "./lib/WebGPUConstants.ts";
import DepthStencilAttachment from "./lib/textures/DepthStencilAttachment.ts";
import UI from "./lib/UI/UI.ts";
import ModelRenderer from "./lib/model/ModelRenderer.ts";


export default class CanvasRenderPass extends RenderPass {
    public canvasColorAttachment: ColorAttachment;

    private canvasColorTarget: RenderTexture;
    private canvasDepthTarget: RenderTexture;
public modelRenderer:ModelRenderer;

    constructor(renderer: Renderer) {

        super(renderer, "canvasRenderPass");
        this.modelRenderer =new ModelRenderer(renderer,"mainModelRenderer");
        this.sampleCount = 4


        this.canvasColorTarget = new RenderTexture(renderer, "canvasColor", {
            format: renderer.presentationFormat,
            sampleCount: this.sampleCount,
            scaleToCanvas: true,

            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });

        this.canvasColorAttachment = new ColorAttachment(this.canvasColorTarget, {
            clearValue: {
                r: 0.0,
                g: 0.0,
                b: 0.0,
                a: 1
            }
        });
        this.colorAttachments = [this.canvasColorAttachment];

        this.canvasDepthTarget = new RenderTexture(renderer, "canvasDepth", {
            format: TextureFormat.Depth16Unorm,
            sampleCount: this.sampleCount,
            scaleToCanvas: true,
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
        this.depthStencilAttachment = new DepthStencilAttachment(this.canvasDepthTarget);




    }

    onSettingsChange() {
        super.onSettingsChange();

    }



    draw() {


        this.modelRenderer.draw(this)
        UI.drawGPU(this.passEncoder, true)
    }

}
