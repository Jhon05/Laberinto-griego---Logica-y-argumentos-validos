(function(){
  'use strict';

  function findApi(startWindow){
    let current=startWindow, attempts=0;
    while(current && attempts<30){
      try{
        if(current.API) return {api:current.API,version:'1.2'};
        if(current.API_1484_11) return {api:current.API_1484_11,version:'2004'};
        if(current.parent && current.parent!==current) current=current.parent; else break;
      }catch(_){ break; }
      attempts++;
    }
    try{ if(window.opener && window.opener!==window) return findApi(window.opener); }catch(_){}
    return null;
  }
  function isTrue(v){ return String(v).toLowerCase()==='true'; }
  function clamp(v,min,max){ v=Number(v); return Math.max(min,Math.min(max,Number.isFinite(v)?v:0)); }
  function time12(seconds){
    const n=Math.max(0,Math.floor(seconds));
    const h=String(Math.floor(n/3600)).padStart(2,'0');
    const m=String(Math.floor((n%3600)/60)).padStart(2,'0');
    const s=String(n%60).padStart(2,'0');
    return `${h}:${m}:${s}`;
  }
  function time2004(seconds){
    const n=Math.max(0,Math.floor(seconds));
    return `PT${Math.floor(n/3600)}H${Math.floor((n%3600)/60)}M${n%60}S`;
  }

  const bridge={
    api:null,version:null,initialized:false,terminated:false,startedAt:Date.now(),lastError:'',
    initialize(){
      if(this.initialized) return true;
      const found=findApi(window);
      if(!found){ this.lastError='No se encontró la API SCORM. Abre el paquete desde Brightspace para enviar la nota.'; return false; }
      this.api=found.api; this.version=found.version;
      try{
        const r=this.version==='2004'?this.api.Initialize(''):this.api.LMSInitialize('');
        this.initialized=isTrue(r);
        if(!this.initialized) this.lastError='Brightspace encontró el SCO, pero la sesión SCORM no pudo inicializarse.';
      }catch(err){ this.lastError=String(err?.message||err); this.initialized=false; }
      if(this.initialized){
        const status=this.getValue('cmi.core.lesson_status','cmi.completion_status');
        if(!status || status==='not attempted' || status==='unknown'){
          this.setValue('cmi.core.lesson_status','cmi.completion_status','incomplete');
        }
        this.setExit('suspend');
        this.commit();
      }
      return this.initialized;
    },
    getValue(k12,k04){
      if(!this.initialized||!this.api) return '';
      try{return this.version==='2004'?this.api.GetValue(k04):this.api.LMSGetValue(k12);}catch(_){return '';}
    },
    setValue(k12,k04,value){
      if(!this.initialized||!this.api||this.terminated) return false;
      try{return isTrue(this.version==='2004'?this.api.SetValue(k04,String(value)):this.api.LMSSetValue(k12,String(value)));}catch(_){return false;}
    },
    commit(){
      if(!this.initialized||!this.api||this.terminated) return false;
      try{return isTrue(this.version==='2004'?this.api.Commit(''):this.api.LMSCommit(''));}catch(_){return false;}
    },
    setExit(v){ this.setValue('cmi.core.exit','cmi.exit',v); },
    getLearnerName(){ if(!this.initialized) this.initialize(); return this.getValue('cmi.core.student_name','cmi.learner_name')||''; },
    getLearnerId(){ if(!this.initialized) this.initialize(); return this.getValue('cmi.core.student_id','cmi.learner_id')||''; },
    setSessionTime(){
      if(!this.initialized) return;
      const seconds=(Date.now()-this.startedAt)/1000;
      this.setValue('cmi.core.session_time','cmi.session_time',this.version==='2004'?time2004(seconds):time12(seconds));
    },
    sendFinalGrade(score5,answered,metadata){
      const score=clamp(score5,0,5);
      if(!this.initialized) this.initialize();
      if(!this.initialized) return false;
      this.setValue('cmi.core.score.raw','cmi.score.raw',score.toFixed(2));
      this.setValue('cmi.core.score.min','cmi.score.min','0');
      this.setValue('cmi.core.score.max','cmi.score.max','5');
      if(this.version==='2004') this.setValue('cmi.score.scaled','cmi.score.scaled',(score/5).toFixed(4));
      const payload={score:Number(score.toFixed(2)),answered:Number(answered)||0,finishedAt:new Date().toISOString(),metadata:metadata||{}};
      this.setValue('cmi.suspend_data','cmi.suspend_data',JSON.stringify(payload).slice(0,3500));
      this.setSessionTime();
      if(this.version==='2004'){
        this.setValue('cmi.completion_status','cmi.completion_status','completed');
      }else{
        this.setValue('cmi.core.lesson_status','cmi.completion_status','completed');
      }
      this.setExit('');
      const committed=this.commit();
      try{
        const r=this.version==='2004'?this.api.Terminate(''):this.api.LMSFinish('');
        this.terminated=isTrue(r);
      }catch(_){ this.terminated=false; }
      return committed || this.terminated;
    }
  };

  window.SCORMBridge=bridge;
  window.addEventListener('DOMContentLoaded',()=>bridge.initialize());
  window.addEventListener('beforeunload',()=>{
    if(!bridge.initialized||bridge.terminated) return;
    bridge.setSessionTime();bridge.setExit('suspend');bridge.commit();
  });
}());
