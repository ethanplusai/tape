import {TapeCore} from './core.mjs';
class TapeProcessor extends AudioWorkletProcessor{
 constructor(){super();this.clock=0;this.core=new TapeCore(sampleRate,event=>this.port.postMessage(event));this.mono=new Float32Array(128);this.port.onmessage=({data})=>{if(data.type==='export'){this.port.postMessage({type:'export',id:data.id,state:this.core.exportState()});return;}this.core.command(data);this.port.postMessage({type:'state',state:this.core.snapshot()});};}
 process(inputs,outputs){const out=outputs[0]?.[0];if(!out)return true;const channels=inputs[0];if(this.mono.length!==out.length)this.mono=new Float32Array(out.length);this.mono.fill(0);if(channels?.length)for(const channel of channels)for(let n=0;n<out.length;n++)this.mono[n]+=channel[n]/channels.length;this.core.process(this.mono,out);for(let c=1;c<outputs[0].length;c++)outputs[0][c].set(out);this.clock+=out.length;if(this.clock>=sampleRate/30){this.clock=0;this.port.postMessage({type:'state',state:this.core.snapshot()});}return true;}
}
registerProcessor('tape-session',TapeProcessor);
