import './style.css'
import Main from "./webgpu/Main.ts";



document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <canvas id="webgpuCanvas"></canvas>
`

const main  =new Main()
