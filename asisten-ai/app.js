(() => {
 const $=id=>document.getElementById(id);
 let mode='live',recognition=null,listening=false,finalTranscript='';
 const question=$('question'),results=$('results'); let KB=null;
 fetch('data/knowledge-base.json').then(r=>{if(!r.ok)throw Error('Basis pengetahuan tidak ditemukan');return r.json()})
 .then(x=>{KB=x;$('micState').textContent=`Basis tesis siap · ${x.chunk_count} bagian`})
 .catch(e=>{$('micState').textContent='Gagal memuat basis tesis';console.error(e)});

 const stopSpeech=()=>{if(recognition&&listening)recognition.stop();listening=false;$('micBtn').classList.remove('listening');$('micLabel').textContent='Mulai dengarkan';};
 $('liveMode').onclick=()=>{mode='live';$('liveMode').classList.add('active');$('manualMode').classList.remove('active');$('modeHint').textContent='Live: ucapan final dicari pada basis tesis. Periksa hasil transkripsi dan sumbernya.'};
 $('manualMode').onclick=()=>{mode='manual';$('manualMode').classList.add('active');$('liveMode').classList.remove('active');$('modeHint').textContent='Semi-Otomatis: periksa dan koreksi transkrip terlebih dahulu, lalu tekan Cari jawaban.'};

 function setupSpeech(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){$('micState').textContent='Speech Recognition tidak didukung browser ini';$('micBtn').disabled=true;return null;}
  const rec=new SR();rec.lang='id-ID';rec.continuous=true;rec.interimResults=true;rec.maxAlternatives=1;
  rec.onstart=()=>{listening=true;$('micBtn').classList.add('listening');$('micLabel').textContent='Hentikan pendengaran';$('micState').textContent='Mendengarkan pertanyaan…'};
  rec.onresult=e=>{
   let interim='';
   for(let i=e.resultIndex;i<e.results.length;i++){
    const phrase=e.results[i][0].transcript;
    if(e.results[i].isFinal)finalTranscript=(finalTranscript+' '+phrase).trim();else interim+=' '+phrase;
   }
   question.value=(finalTranscript+interim).trim();
   if(mode==='live'&&finalTranscript.trim().length>12){
    const q=finalTranscript.trim(); finalTranscript=''; question.value='';
    runSearch(q);
   }
  };
  rec.onerror=e=>{$('micState').textContent='Mikrofon: '+e.error;if(['not-allowed','service-not-allowed'].includes(e.error))stopSpeech();};
  rec.onend=()=>{listening=false;$('micBtn').classList.remove('listening');$('micLabel').textContent='Mulai dengarkan';if($('micState').textContent==='Mendengarkan pertanyaan…')$('micState').textContent='Pendengaran berhenti';};
  return rec;
 }
 recognition=setupSpeech();
 $('micBtn').onclick=()=>{if(!recognition)return;if(listening){stopSpeech();return;}try{finalTranscript=question.value.trim();recognition.start();}catch(e){$('micState').textContent='Tidak dapat memulai mikrofon. Muat ulang halaman.';}};

 // Retrieval dibuat berbasis BM25: istilah yang jarang dan spesifik mendapat bobot lebih tinggi.
 const STOP=new Set(('apa apakah bagaimana mengapa dimana kapan siapa yang dan di ke dari untuk pada dalam dengan adalah itu ini atau akan dapat sebagai melalui terhadap oleh secara serta tidak lebih juga suatu para saat tentang jelaskan jelaskanlah maksud dimaksud definisi pengertian').split(' '));
 const FRONT=/^(dokumen tesis|halaman pengesahan|pernyataan|halaman persembahan|kata pengantar|daftar isi|daftar tabel|daftar gambar|intisari|abstract)$/i;
 const ALIASES={
  'urban patchwork':['mosaik ruang','keragaman spasial','patch urbanism','kerangka analitik','produksi ruang','patch'],
  'patchwork':['mosaik ruang','keragaman spasial','patch urbanism','kerangka analitik'],
  'skater':['spatially constrained clustering','kontiguitas','queen contiguity','regionalisasi'],
  'h3':['grid heksagonal','resolusi 9','unit analisis'],
  'connected fragmentation':['fragmentasi','keterhubungan','kontiguitas','fragmentasi terkoneksi'],
  'triad spasial':['conceived space','perceived space','lived space','lefebvre'],
  'kebaruan':['kontribusi konseptual','patch urbanism','kerangka analitik']
 };
 const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,' ').replace(/\s+/g,' ').trim();
 function tokens(s){return norm(s).split(' ').filter(w=>w.length>2&&!STOP.has(w)).map(w=>w.replace(/(nya|lah|kah|kan|an|i)$/,'').replace(/(nya|lah|kah|kan|an|i)$/,''));}
 function expandQuery(q){
  const base=tokens(q),n=norm(q),extra=[];
  for(const [k,vals] of Object.entries(ALIASES))if(n.includes(k))extra.push(...vals.flatMap(tokens));
  return [...new Set([...base,...extra])];
 }
 function isFront(c){return FRONT.test((c.section||'').trim())||/judul tesis|untuk memenuhi syarat|telah dipertahankan di depan/i.test((c.text||'').slice(0,220));}
 function makeIndex(){
  const docs=KB.chunks.map((c,i)=>({ ...c,_id:i,_tokens:tokens((c.section||'')+' '+(c.text||'')) })).filter(c=>!isFront(c)&&c._tokens.length>8);
  const df=new Map();
  for(const d of docs)for(const t of new Set(d._tokens))df.set(t,(df.get(t)||0)+1);
  const avg=docs.reduce((s,d)=>s+d._tokens.length,0)/(docs.length||1);
  return {docs,df,avg,N:docs.length};
 }
 let INDEX=null;
 function bm25(q,d){
  const termsQ=expandQuery(q),freq=new Map();for(const t of d._tokens)freq.set(t,(freq.get(t)||0)+1);
  let score=0;
  for(const t of termsQ){
   const f=freq.get(t)||0;if(!f)continue;
   const df=INDEX.df.get(t)||0,idf=Math.log(1+(INDEX.N-df+0.5)/(df+0.5));
   const k1=1.35,b=.72,dl=d._tokens.length;
   score+=idf*(f*(k1+1))/(f+k1*(1-b+b*dl/INDEX.avg));
  }
  // Prioritaskan bab/subbab analitis dibanding bagian awal administratif.
  const sec=(d.section||'').toLowerCase();
  if(/kontribusi konseptual|kerangka pemikiran|konsep urban patchwork|kesimpulan|hasil penelitian|pembahasan/.test(sec))score*=1.16;
  if(/kata pengantar|pernyataan|persembahan|daftar/.test(sec))score*=0.05;
  return score;
 }
 function sentencePick(text,q,limit=3){
  const sentences=(text||'').replace(/\s+/g,' ').split(/(?<=[.!?])\s+(?=[A-Z0-9“"(])/).filter(s=>s.length>55);
  const qterms=expandQuery(q);
  return sentences.map((s,i)=>({s,i,score:qterms.reduce((n,t)=>n+(tokens(s).includes(t)?1:0),0)}))
   .filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).sort((a,b)=>a.i-b.i).map(x=>x.s);
 }
 function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function runSearch(q){
  if(!KB){results.innerHTML='<div class="empty">Basis pengetahuan belum siap. Muat ulang halaman.</div>';return;}
  if(!q.trim())return;
  if(!INDEX)INDEX=makeIndex();
  const ranked=INDEX.docs.map(d=>({...d,score:bm25(q,d)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,7);
  if(!ranked.length){results.innerHTML='<article class="answer-card"><h3>Belum ditemukan dukungan yang memadai dalam draft tesis</h3><p class="answer-text">Coba rumuskan ulang pertanyaan dengan istilah yang digunakan dalam naskah. Sistem tidak akan membuat jawaban di luar sumber yang ditemukan.</p></article>';return;}
  const chosen=ranked.slice(0,4);
  const snippets=chosen.map(d=>({section:d.section,lines:sentencePick(d.text,q,3)})).filter(x=>x.lines.length);
  const cards=snippets.map((x,i)=>`<article class="answer-card"><div class="result-meta">SUMBER ${i+1} · DRAFT TESIS</div><h3>${esc(x.section)}</h3><ul class="answer-text">${x.lines.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></article>`).join('');
  const isDefinition=/apa itu|pengertian|definisi|dimaksud|makna/.test(norm(q));
  const intro=isDefinition
   ?'Untuk menjelaskan istilah tersebut, mulai dari posisi konsep dalam kerangka penelitian, kemudian uraikan bagaimana konsep dioperasionalkan dan apa maknanya bagi hasil penelitian.'
   :'Berikut bagian tesis yang paling berkaitan dengan pertanyaan. Gunakan urutan konsep, bukti/metode, lalu implikasi untuk menyusun jawaban lisan.';
  results.innerHTML=`<article class="answer-card"><div class="result-meta">PENELUSURAN BERDASARKAN ISI TESIS · ${snippets.length} SUBBAGIAN TERPILIH</div><h3>Bahan jawaban yang relevan</h3><p class="answer-text">${esc(intro)}</p><p class="source">Hasil di bawah merupakan kutipan terpilih dari bagian yang paling relevan, bukan jawaban generatif. Periksa konteks paragraf pada naskah sebelum menyampaikannya.</p></article>${cards}<article class="answer-card"><div class="result-meta">BATASAN SISTEM</div><p class="answer-text">Mode gratis ini menggunakan pencarian isi dokumen dan pemilihan kalimat relevan. Sistem belum melakukan penalaran generatif seperti ChatGPT. Jika pertanyaan memerlukan sintesis lintas bab atau informasi yang tidak tertulis, jawaban harus dirumuskan dan diverifikasi secara mandiri.</p></article>`;
 }
 $('answerBtn').onclick=()=>runSearch(question.value);
 $('clearBtn').onclick=()=>{question.value='';finalTranscript='';results.innerHTML='<div class="empty"><div class="empty-icon">⌕</div><h3>Jawaban akan muncul di sini</h3><p>Ajukan pertanyaan tentang isi tesis.</p></div>';};
 document.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{question.value=b.textContent.trim();runSearch(question.value);});
})();
