/* Manasenger — face tracking in a background thread, so the camera picture never waits for it.
   Gets a frame, returns 478 face points, the expression scores masks react to, and the head position. */
import {FilesetResolver,FaceLandmarker} from '/vendor/mp/vision_bundle.mjs';
let fl=null,files=null,delegate='GPU';
async function makeFace(d){
  return FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/vendor/mp/face_landmarker.task',delegate:d},
    runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:true,outputFacialTransformationMatrixes:true,
    minFaceDetectionConfidence:.5,minFacePresenceConfidence:.5,minTrackingConfidence:.5,
    canvas:d==='GPU'?new OffscreenCanvas(1,1):undefined});
}
let slow=0,n=0;
onmessage=async e=>{
  const m=e.data;
  try{
    if(m.t==='init'){
      files=await FilesetResolver.forVisionTasks('/vendor/mp',true);
      delegate=m.cpu?'CPU':'GPU';
      try{fl=await makeFace(delegate)}catch(err){delegate='CPU';fl=await makeFace('CPU')}
      postMessage({t:'ready',delegate});return;
    }
    if(m.t==='frame'){
      const bmp=m.bmp,t0=performance.now();let out={t:'res',ts:m.ts};
      const r=fl.detectForVideo(bmp,m.ts);
      if(r.faceLandmarks&&r.faceLandmarks[0]){
        const L=r.faceLandmarks[0],lm=new Float32Array(L.length*3);
        for(let i=0;i<L.length;i++){lm[i*3]=L[i].x;lm[i*3+1]=L[i].y;lm[i*3+2]=L[i].z}
        const bs=new Float32Array(52);const c=r.faceBlendshapes&&r.faceBlendshapes[0];if(c)c.categories.forEach((k,i)=>bs[i]=k.score);
        out.lm=lm;out.bs=bs;out.mat=r.facialTransformationMatrixes&&r.facialTransformationMatrixes[0]?new Float32Array(r.facialTransformationMatrixes[0].data):null;
      }
      bmp.close();
      /* the graphics chip turned out slow on this phone: ask to restart tracking on the processor */
      const dt=performance.now()-t0;if(delegate==='GPU'&&++n>10&&slow>=0){slow=dt>55?slow+1:0;if(slow>8){slow=-1;postMessage({t:'slow'})}}
      out.ms=Math.round(dt);
      postMessage(out,[out.lm&&out.lm.buffer,out.bs&&out.bs.buffer].filter(Boolean));
    }
  }catch(err){if(m.bmp)try{m.bmp.close()}catch(x){};postMessage({t:'error',error:String(err&&err.message||err),ts:m.ts})}
};
