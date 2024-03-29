import Shader from "./lib/core/Shader.ts";
import {ShaderType} from "./lib/core/ShaderTypes.ts";
import Camera from "./lib/Camera.ts";
import ModelTransform from "./lib/model/ModelTransform.ts";


export default class ParticleShader extends Shader{


    init(){

        if(this.attributes.length==0) {
            this.addAttribute("aPos", ShaderType.vec3);
            this.addAttribute("aNormal", ShaderType.vec3);
            this.addAttribute("aInstancePos", ShaderType.vec4,1,"instance");
        }
        //this.renderer.texturesByLabel["GDepth"]

        this.needsTransform =true;
        this.needsCamera=true;
        this.logShaderCode =true;
    }
    getShaderCode(): string {
        return /* wgsl */ `
///////////////////////////////////////////////////////////      
struct VertexOutput
{

     @location(0) normal : vec3f,
    @builtin(position) position : vec4f
  
}


${Camera.getShaderText(0)}
${ModelTransform.getShaderText(1)}
${this.getShaderUniforms(2)}

@vertex
fn mainVertex( ${this.getShaderAttributes()} ) -> VertexOutput
{
    var output : VertexOutput;
    
    output.position =camera.viewProjectionMatrix*model.modelMatrix *vec4( aPos+aInstancePos.xyz,1.0);
    output.normal =aNormal;
    return output;
}


@fragment
fn mainFragment(@location(0) normal: vec3f) ->   @location(0) vec4f
{
        let d = dot(normal,vec3(0.0,1.0,0.0))*0.6+0.4;
  return vec4f(vec3(d),1.0);
 
}
///////////////////////////////////////////////////////////
        
        
        
        
        
        
        
        
        `
    }



}
