import Renderer from "./lib/Renderer.ts";
import UniformGroup from "./lib/core/UniformGroup.ts";


export default class Compute {
    private renderer: Renderer;
    private passEncoder: GPUComputePassEncoder;
    private computePipeline: GPUComputePipeline;
    private numComps = 10;

    public uniformGroup: UniformGroup;

    private pipeLineLayout: GPUPipelineLayout;
    private bindGroupA: GPUBindGroup;
    private bindGroupB: GPUBindGroup;
    private bindGroupLayout: GPUBindGroupLayout;
    constructor(renderer: Renderer,bufA:GPUBuffer,bufB:GPUBuffer,bufSpeedA:GPUBuffer,bufSpeedB:GPUBuffer,byteLength:number) {
        this.renderer = renderer;
        this.uniformGroup = new UniformGroup(this.renderer, "testCompute", "test")
        this.uniformGroup.addUniform("time", 1);


       this.bindGroupLayout = this.renderer.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                    },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                    },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                    },
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "storage",
                    },
                },
            ],
        });

        this.bindGroupB = this.renderer.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: bufA,
                        offset: 0,
                        size: byteLength,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: bufB,
                        offset: 0,
                        size: byteLength,
                    },
                },
                {
                    binding: 2,
                    resource: {
                        buffer: bufSpeedA,
                        offset: 0,
                        size: byteLength,
                    },
                },
                {
                    binding: 3,
                    resource: {
                        buffer: bufSpeedB,
                        offset: 0,
                        size: byteLength,
                    },
                },
            ],
        });

        this.bindGroupA = this.renderer.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: bufB,
                        offset: 0,
                        size: byteLength,
                    },
                },
                {
                    binding: 1,
                    resource: {
                        buffer: bufA,
                        offset: 0,
                        size: byteLength,
                    },
                },
                {
                    binding: 2,
                    resource: {
                        buffer: bufSpeedB,
                        offset: 0,
                        size: byteLength,
                    },
                },
                {
                    binding: 3,
                    resource: {
                        buffer: bufSpeedA,
                        offset: 0,
                        size: byteLength,
                    },
                },
            ],
        });

    }


    public add(pingPong :number,size:number) {

        let descriptor: GPUComputePassDescriptor = {}
        this.passEncoder = this.renderer.commandEncoder.beginComputePass(
            descriptor
        );
        this.passEncoder.setPipeline(this.getPipeLine());
        this.passEncoder.setBindGroup(0, this.uniformGroup.bindGroup);
        if(pingPong%2==0){
            this.passEncoder.setBindGroup(1, this.bindGroupA);
        }
    else{
            this.passEncoder.setBindGroup(1, this.bindGroupB);
        }


        this.passEncoder.dispatchWorkgroups(Math.ceil(size/64), 1, 1);

        this.passEncoder.end();
    }

    getPipeLine() {
        this.pipeLineLayout = this.renderer.device.createPipelineLayout({
            label: "Compute_pipelineLayout_",
            bindGroupLayouts: [this.uniformGroup.bindGroupLayout,this.bindGroupLayout],
        });
        // if( this.computePipeline)return  this.computePipeline;
        this.computePipeline = this.renderer.device.createComputePipeline({
            layout: this.pipeLineLayout,
            compute: {
                module: this.renderer.device.createShaderModule({
                    code: this.getShaderCode(),
                }),

                entryPoint: 'main',
            },
        });
        return this.computePipeline;


    }

    private getShaderCode() {
        return /* wgsl */ `
fn mod289_3(x: vec3<f32>) -> vec3<f32> {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

fn mod289_4(x: vec4<f32>) -> vec4<f32> {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}
fn permute_4(x: vec4<f32>) -> vec4<f32> {
  return mod289_4(((x * 34.0) + 10.0) * x);
}
fn taylorInvSqrt_4(r: vec4<f32>) -> vec4<f32> {
  return 1.79284291400159 - 0.85373472095314 * r;
}


   fn snoise3d(v: vec3<f32>) -> f32 {
  let C = vec2<f32>(1.0 / 6.0, 1.0 / 3.0) ;
  let D = vec4<f32>(0.0, 0.5, 1.0, 2.0);

  // First corner
  var i = floor(v + dot(v, C.yyy));
  let x0 = v - i + dot(i, C.xxx);

  // Other corners
  let g = step(x0.yzx, x0.xyz);
  let l = 1.0 - g;
  let i1 = min( g.xyz, l.zxy );
  let i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  let x1 = x0 - i1 + C.xxx;
  let x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  let x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289_3(i);
  let p = permute_4(
    permute_4(
      permute_4(i.z + vec4<f32>(0.0, i1.z, i2.z, 1.0)) + i.y + vec4<f32>(0.0, i1.y, i2.y, 1.0)
    ) + i.x + vec4<f32>(0.0, i1.x, i2.x, 1.0)
  );

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  let n_ = 0.142857142857; // 1.0/7.0
  let  ns = n_ * D.wyz - D.xzx;

  let j = p - 49.0 * floor(p * ns.z * ns.z); // mod(p, 7 * 7)

  let x_ = floor(j * ns.z);
  let y_ = floor(j - 7.0 * x_); // mod(j, N)

  let x = x_ * ns.x + ns.yyyy;
  let y = y_ * ns.x + ns.yyyy;
  let h = 1.0 - abs(x) - abs(y);

  let b0 = vec4<f32>(x.xy, y.xy);
  let b1 = vec4<f32>(x.zw, y.zw);

  // let s0 = vec4<f32>(lessThan(b0,0.0))*2.0 - 1.0;
  // let s1 = vec4<f32>(lessThan(b1,0.0))*2.0 - 1.0;
  let s0 = floor(b0) * 2.0 + 1.0;
  let s1 = floor(b1) * 2.0 + 1.0;
  let sh = -step(h, vec4<f32>(0.0));

  let a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  let a1 = b1.xzyw + s1.xzyw*sh.zzww;

  var p0 = vec3<f32>(a0.xy, h.x);
  var p1 = vec3<f32>(a0.zw, h.y);
  var p2 = vec3<f32>(a1.xy, h.z);
  var p3 = vec3<f32>(a1.zw, h.w);

  // Normalise gradients
  let norm = taylorInvSqrt_4(vec4<f32>(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 = p0 * norm.x;
  p1 = p1 * norm.y;
  p2 = p2 * norm.z;
  p3 = p3 * norm.w;

  // Mix final noise value
  var m = max(0.6 - vec4<f32>(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), vec4<f32>(0.0));
  m = m * m;

  return 42.0 * dot(
    m * m,
    vec4<f32>(dot(p0, x0), dot(p1,x1), dot(p2,x2), dot(p3,x3))
  );
}
   
struct Uniforms
{
    time : f32,
}




struct Particles {
  particles : array<vec4f>,
}
@group(0) @binding(0)  var<uniform> uniforms : Uniforms ;
@group(1) @binding(0) var<storage,read> in : Particles;
@group(1) @binding(1) var<storage, read_write> out :Particles;
@group(1) @binding(2) var<storage,read> inSpeed : Particles;
@group(1) @binding(3) var<storage, read_write> outSpeed :Particles;
@compute @workgroup_size(64,1,1)
        fn main(
        @builtin(workgroup_id) workgroupID : vec3<u32>,
        @builtin(global_invocation_id) global_id : vec3<u32>
         ) {
        
        let index = global_id.x;
        var tar = in.particles [index];
        let w =tar.w;
        var speed =inSpeed.particles [index];
       /* for (var i = 0u; i < arrayLength(&in.particles); i++) {
            if (i == index) {
                continue;
            }

            let pos = in.particles[i];

            if (distance(pos.xyz, tar.xyz) <0.1) {
          tar-=vec4((pos.xyz- tar.xyz),0.0);
            }
         }*/
     let wp=0.025+w*w*w*0.02;
         let tarS = tar*0.2;
         let t = uniforms.time*9;
         let x =abs(snoise3d(vec3(tarS.zy,t))*0.03)+0.04;
         let y = snoise3d(vec3(t,tarS.xz))*wp+snoise3d(vec3(t*0.2,tar.xz*0.01))*0.05;
         let z  = snoise3d(vec3(tarS.x,t,tarS.z))*wp*2+snoise3d(vec3(t*0.2,tar.yx*0.01))*0.05;;
         
         
         
         
         speed+=vec4f(x,y,z,0.0)*0.1;
         
         
         
         speed*=0.970;
       
         tar+=vec4(speed.xyz*0.5,0);
      
         if(tar.x>20.0){
       let x =tar.x;
       tar.x =0;
                tar =vec4(normalize(tar.xyz)*w*3.0,tar.w);
                 tar.z =abs(tar.z);
                tar.x =x -40;
             speed  *=vec4(0.0);
           }
            tar.w =w;
         out.particles [index] =tar;
        outSpeed.particles [index]= speed;
          
        }
`;
    }
}
