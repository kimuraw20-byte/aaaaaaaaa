// ===== Utilities =====
const $  = (s,root=document)=>root.querySelector(s);
const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

// Theme
const root = document.documentElement;
const savedTheme = localStorage.getItem('uni:theme');
if(savedTheme){ root.setAttribute('data-theme', savedTheme); }
$('#themeToggle').addEventListener('click', ()=>{
  const cur = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', cur);
  localStorage.setItem('uni:theme', cur);
});

// Seeds
const seedSubjects = [
  { id:'physics', name:'الفيزياء',   grad:'grad-green', emoji:'🧪' },
  { id:'math',    name:'الرياضيات',  grad:'grad-blue',  emoji:'🧮' },
  { id:'chem',    name:'الكيمياء',   grad:'grad-orange',emoji:'🧫' },
];

// State
const state = { view:'home', subject:null, tab:'notes', viewerIndex:0 };

// Storage helpers
const LS = {
  get(key, def){ try{ return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(def)); }catch{ return def; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
};

// Subjects list
function loadSubjects(){
  let list = LS.get('uni:subjects', null);
  if(!list){ list = seedSubjects; saveSubjects(list); }
  return list;
}
function saveSubjects(list){ LS.set('uni:subjects', list); }

function subjectKey(id, type){ return `uni:${id}:${type}`; }
function loadData(id, type){ return LS.get(subjectKey(id,type), []); }
function saveData(id, type, data){ LS.set(subjectKey(id,type), data); }

// ===== UI Build: Home =====
const grid = $('#subjectsGrid');
function renderHome(){
  const subs = loadSubjects();
  grid.innerHTML = subs.map(s=>`
    <article class="card ${s.grad}" data-id="${s.id}" role="button" tabindex="0">
      <div class="emoji">${s.emoji}</div>
      <h3>${s.name}</h3>
    </article>`).join('');
}
renderHome();

grid.addEventListener('click', e=>{
  const card = e.target.closest('.card'); if(!card) return;
  openSubject(card.dataset.id);
});

// Add subject via FAB on home
const fab = $('#fab');
fab.addEventListener('click', ()=>{
  if(state.view==='home'){
    const name = prompt('اسم المادة الجديدة؟');
    if(!name) return;
    const id = name.trim().toLowerCase().replace(/\s+/g,'-') + '-' + Date.now().toString(36).slice(-3);
    const grads = ['grad-blue','grad-green','grad-orange','grad-purple','grad-brown','grad-slate'];
    const emojis= ['📘','🧮','🧪','🧫','🔭','💻','✏️','📚'];
    const sub = { id, name, grad: grads[Math.floor(Math.random()*grads.length)], emoji: emojis[Math.floor(Math.random()*emojis.length)] };
    const list = loadSubjects(); list.unshift(sub); saveSubjects(list);
    renderHome(); toast('تمت إضافة المادة ✔️','good');
  } else {
    openAddDialogForTab(state.tab);
  }
});

// Back button
$('#backBtn').addEventListener('click', ()=>{ if(state.view==='subject'){ showHome(); } });
function showHome(){
  state.view='home'; state.subject=null;
  $('#pageTitle').textContent='منظّم الدراسة';
  $('#homeView').classList.add('active');
  $('#subjectView').classList.remove('active');
  fab.title='إضافة مادة';
}

// ===== Subject View =====
function openSubject(id){
  const sub = loadSubjects().find(s=>s.id===id);
  if(!sub) return;
  state.view='subject'; state.subject=sub; state.tab='notes';
  $('#pageTitle').textContent=sub.name;
  $('#homeView').classList.remove('active');
  $('#subjectView').classList.add('active');
  fab.title='إضافة';
  switchTab('notes');
  renderAllLists();
}

// Tabs
$$('#tabs .tab').forEach(b=>b.addEventListener('click', ()=>switchTab(b.dataset.tab)));
function switchTab(tab){
  state.tab = tab;
  $$('#tabs .tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
  ['notes','files','images','audio'].forEach(t=>$('#tab-'+t).classList.toggle('hide', t!==tab));
}

// Render lists
function renderAllLists(){ renderNotes(); renderFiles(); renderImages(); renderAudio(); }

function renderNotes(){
  const list = loadData(state.subject.id,'notes');
  $('#empty-notes').style.display = list.length? 'none':'block';
  $('#list-notes').innerHTML = list.map((n,i)=>`
    <article class="note" data-i="${i}">
      <div class="actions">
        <button class="icon-btn" data-act="edit" title="تعديل">✏️</button>
        <button class="icon-btn" data-act="del" title="حذف">🗑️</button>
      </div>
      <h4>${escapeHTML(n.title || 'بدون عنوان')}</h4>
      ${n.body?`<p>${escapeHTML(n.body)}`:''}
      <div class="meta">${new Date(n.ts).toLocaleString('ar-EG',{hour12:false})}</div>
    </article>
  `).join('');
  $('#list-notes').onclick = e=>{
    const n = e.target.closest('.note'); if(!n) return;
    const i = +n.dataset.i; const act = e.target.closest('[data-act]')?.dataset.act;
    const arr = loadData(state.subject.id,'notes');
    if(act==='edit'){ openNoteDialog(arr[i], i); }
    if(act==='del'){ if(confirm('حذف الملاحظة؟')){ arr.splice(i,1); saveData(state.subject.id,'notes',arr); renderNotes(); toast('تم حذف الملاحظة','bad'); } }
  };
}

function renderFiles(){
  const list = loadData(state.subject.id,'files');
  $('#empty-files').style.display = list.length? 'none':'block';
  $('#list-files').innerHTML = list.map((f,i)=>{
    const name = escapeHTML(f.title || f.fileName || 'ملف');
    const link = f.data ? `<a href="${escapeAttr(f.data)}" download="${escapeAttr(f.fileName||'file')}">تنزيل</a>`
                        : (f.url?`<a href="${escapeAttr(f.url)}" target="_blank" rel="noopener">فتح الرابط</a>`:'');
    return `<div class="item" data-i="${i}">
      <strong>${name}</strong><br/>${link}
      <div class="row" style="justify-content:flex-end;margin-top:6px">
        <button class="btn ghost" data-act="del">حذف</button>
      </div></div>`;
  }).join('');
  $('#list-files').onclick = e=>{
    const item = e.target.closest('.item'); if(!item) return;
    const i = +item.dataset.i; const act = e.target.dataset.act;
    const arr = loadData(state.subject.id,'files');
    if(act==='del'){ if(confirm('حذف؟')){ arr.splice(i,1); saveData(state.subject.id,'files',arr); renderFiles(); toast('تم حذف الملف','bad'); } }
  };
}

function renderImages(){
  const list = loadData(state.subject.id,'images');
  $('#empty-images').style.display = list.length? 'none':'block';
  $('#list-images').innerHTML = list.map((img,i)=>`
    <figure class="img-card" data-i="${i}">
      <img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.title||'Image')}" />
      <figcaption class="cap">${escapeHTML(img.title||'')}</figcaption>
    </figure>`).join('');
  // open viewer
  $('#list-images').onclick = e=>{
    const card = e.target.closest('.img-card'); if(!card) return;
    const i = +card.dataset.i; openViewer(i);
  };
}

function renderAudio(){
  const list = loadData(state.subject.id,'audio');
  $('#empty-audio').style.display = list.length? 'none':'block';
  $('#list-audio').innerHTML = list.map((a,i)=>`
    <div class="item" data-i="${i}">
      <strong>${escapeHTML(a.title||a.fileName||'صوت')}</strong>
      <div style="margin-top:6px"><audio controls src="${escapeAttr(a.src||a.data)}"></audio></div>
      <div class="row" style="justify-content:flex-end;margin-top:6px">
        <button class="btn ghost" data-act="del">حذف</button>
      </div>
    </div>`).join('');
  $('#list-audio').onclick = e=>{
    const item = e.target.closest('.item'); if(!item) return;
    const i = +item.dataset.i; const act = e.target.dataset.act;
    const arr = loadData(state.subject.id,'audio');
    if(act==='del'){ if(confirm('حذف الملف الصوتي؟')){ arr.splice(i,1); saveData(state.subject.id,'audio',arr); renderAudio(); toast('تم حذف الصوت','bad'); } }
  };
}

// ===== Dialogs depending on tab =====
const dialog = $('#dialog');
$('#dlgSave').addEventListener('click', e=>{ e.preventDefault(); handleDialogSave(); });

function openAddDialogForTab(tab){
  if(tab==='notes') openNoteDialog();
  if(tab==='files') openFileDialog();
  if(tab==='images') openImageDialog();
  if(tab==='audio') openAudioDialog();
}

function openNoteDialog(data=null, index=null){
  $('#dlgTitle').textContent = index!==null ? 'تعديل ملاحظة' : 'ملاحظة جديدة';
  $('#dlgBody').innerHTML = `
    <div class="field"><label>العنوان</label><input type="text" id="noteTitle" value="${escapeAttr(data?.title||'')}" required></div>
    <div class="field"><label>المحتوى</label><textarea id="noteBody">${data?.body?escapeHTML(data.body):''}</textarea></div>`;
  dialog.dataset.mode='note'; dialog.dataset.index = index==null? '' : String(index);
  dialog.showModal();
}

function openFileDialog(){
  $('#dlgTitle').textContent='ملف جديد';
  $('#dlgBody').innerHTML = `
    <div class="field"><label>اسم الملف</label><input type="text" id="fileTitle" placeholder="اسم الملف أو المقرر"></div>
    <div class="field"><label>رفع ملف</label><input type="file" id="filePick"></div>
    <div class="field"><label>أو رابط (اختياري)</label><input type="text" id="fileUrl" placeholder="https://..."></div>`;
  dialog.dataset.mode='file'; dialog.removeAttribute('data-index'); dialog.showModal();
}

function openImageDialog(){
  $('#dlgTitle').textContent='صورة جديدة';
  $('#dlgBody').innerHTML = `
    <div class="field"><label>عنوان (اختياري)</label><input type="text" id="imgTitle"></div>
    <div class="field"><label>رفع صورة</label><input type="file" id="imgFile" accept="image/*"></div>
    <div class="field"><label>أو رابط صورة</label><input type="text" id="imgUrl" placeholder="https://..."></div>`;
  dialog.dataset.mode='image'; dialog.showModal();
}

function openAudioDialog(){
  $('#dlgTitle').textContent='ملف صوتي جديد';
  $('#dlgBody').innerHTML = `
    <div class="field"><label>عنوان (اختياري)</label><input type="text" id="audTitle"></div>
    <div class="field"><label>رفع صوت</label><input type="file" id="audFile" accept="audio/*"></div>
    <div class="field"><label>أو رابط صوت</label><input type="text" id="audUrl" placeholder="https://...mp3"></div>`;
  dialog.dataset.mode='audio'; dialog.showModal();
}

function handleDialogSave(){
  const mode = dialog.dataset.mode;
  if(mode==='note'){
    const title = $('#noteTitle').value.trim();
    const body = $('#noteBody').value.trim();
    if(!title){ $('#noteTitle').reportValidity(); return; }
    const arr = loadData(state.subject.id,'notes');
    const index = dialog.dataset.index===''? null : +dialog.dataset.index;
    const obj = { title, body, ts: Date.now() };
    if(index===null){ arr.unshift(obj); toast('تمت إضافة الملاحظة ✔️','good'); } else { arr[index]=obj; toast('تم التعديل ✔️','good'); }
    saveData(state.subject.id,'notes',arr); dialog.close(); renderNotes();
  }
  if(mode==='file'){
    const title = $('#fileTitle').value.trim();
    const url   = $('#fileUrl').value.trim();
    const file  = $('#filePick').files[0];
    if(!title && !url && !file){ alert('أدخل اسمًا أو حمّل ملفًا أو ضع رابطًا'); return; }
    const arr = loadData(state.subject.id,'files');
    if(file){
      const reader = new FileReader();
      reader.onload = ()=>{
        arr.unshift({ title, fileName:file.name, data: reader.result, ts:Date.now() });
        saveData(state.subject.id,'files',arr); dialog.close(); renderFiles(); toast('تم رفع الملف ✔️','good');
      };
      reader.readAsDataURL(file);
      return;
    }
    arr.unshift({ title, url, ts:Date.now() });
    saveData(state.subject.id,'files',arr); dialog.close(); renderFiles(); toast('تمت إضافة الرابط ✔️','good');
  }
  if(mode==='image'){
    const title = $('#imgTitle').value.trim();
    const file = $('#imgFile').files[0];
    const url  = $('#imgUrl').value.trim();
    const finish = (src)=>{
      const arr = loadData(state.subject.id,'images');
      arr.unshift({ title, src, ts:Date.now() });
      saveData(state.subject.id,'images',arr); dialog.close(); renderImages(); toast('تمت إضافة الصورة ✔️','good');
    };
    if(file){
      const reader = new FileReader();
      reader.onload = ()=> finish(reader.result);
      reader.readAsDataURL(file);
      return;
    }
    if(url){ finish(url); return; }
    alert('اختر صورة أو أدخل رابطًا.');
  }
  if(mode==='audio'){
    const title = $('#audTitle').value.trim();
    const file = $('#audFile').files[0];
    const url  = $('#audUrl').value.trim();
    const finish = (src, fileName)=>{
      const arr = loadData(state.subject.id,'audio');
      arr.unshift({ title, src, fileName, ts:Date.now() });
      saveData(state.subject.id,'audio',arr); dialog.close(); renderAudio(); toast('تمت إضافة الصوت ✔️','good');
    };
    if(file){
      const reader = new FileReader();
      reader.onload = ()=> finish(reader.result, file.name);
      reader.readAsDataURL(file);
      return;
    }
    if(url){ finish(url); return; }
    alert('اختر ملف صوتي أو أدخل رابطًا.');
  }
}

// ===== Image Viewer =====
const viewer = $('#imgViewer');
const viewerImg = $('#viewerImg');
$('#viewerClose').onclick = ()=> viewer.classList.add('hide');
$('#viewerPrev').onclick = ()=> stepViewer(-1);
$('#viewerNext').onclick = ()=> stepViewer(1);
function openViewer(index){
  state.viewerIndex = index;
  const list = loadData(state.subject.id,'images');
  if(!list.length) return;
  viewerImg.src = list[index].src;
  viewer.classList.remove('hide');
}
function stepViewer(delta){
  const list = loadData(state.subject.id,'images');
  if(!list.length) return;
  state.viewerIndex = (state.viewerIndex + delta + list.length) % list.length;
  viewerImg.src = list[state.viewerIndex].src;
}

// ===== Toasts =====
function toast(msg, type='good'){
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + (type==='bad'?'bad':'good');
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transform='translateY(-8px)'; }, 2200);
  setTimeout(()=> el.remove(), 3000);
}

// Helpers
function escapeHTML(s){ return (s||'').replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m])); }
function escapeAttr(s){ return escapeHTML(s); }

// Start on home
showHome();
