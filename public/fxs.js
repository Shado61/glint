/* Manasenger — separates the person from the background, in its own background thread (for background effects). */
import {FilesetResolver,ImageSegmenter} from '/vendor/mp/vision_bundle.mjs';
let seg=null;
onmessage=async e=>{
  const m=e.data;
  try{
    if(m.t==='init'){
      const files=await FilesetResolver.forVisionTasks('/vendor/mp',true);
      seg=await ImageSegmenter.createFromOptions(files,{baseOptions:{modelAssetPath:'/vendor/mp/selfie_segmenter.tflite',delegate:'CPU'},runningMode:'VIDEO',outputConfidenceMasks:true,outputCategoryMask:false});
      postMessage({t:'ready'});return;
    }
    if(m.t==='frame'){
      const r=seg.segmentForVideo(m.bmp,m.ts),mk=r.confidenceMasks&&r.confidenceMasks[0];let out={t:'res'};
      if(mk){const f=mk.getAsFloat32Array(),u=new Uint8Array(f.length);for(let i=0;i<f.length;i++)u[i]=f[i]*255;out.mask={w:mk.width,h:mk.height,d:u}}
      if(r.close)r.close();m.bmp.close();
      postMessage(out,out.mask?[out.mask.d.buffer]:[]);
    }
  }catch(err){if(m.bmp)try{m.bmp.close()}catch(x){}postMessage({t:'error',error:String(err&&err.message||err)})}
};
