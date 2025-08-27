const homeScreen = document.getElementById('homeScreen');
const subjectScreen = document.getElementById('subjectScreen');
const subjectsList = document.getElementById('subjectsList');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const backBtn = document.getElementById('backBtn');
const subjectTitle = document.getElementById('subjectTitle');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addItemBtn = document.getElementById('addItemBtn');
const toast = document.getElementById('toast');
const imagesGrid = document.getElementById('imagesGrid');
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
const closeModal = document.getElementById('closeModal');

let currentSubject = null;
let currentTab = 'notes';

// Helper: Show toast
function showToast(msg) {
  toast.innerText = msg;
  toast.className = 'show';
  setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}

// Load subjects
function loadSubjects() {
  subjectsList.innerHTML = '';
  const subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
  subjects.forEach((s, idx) => {
    const li = document.createElement('li');
    li.textContent = s;
    li.onclick = () => openSubject(s);
    subjectsList.appendChild(li);
  });
}

// Add subject
addSubjectBtn.onclick = () => {
  const name = prompt('اسم المادة:');
  if (name) {
    let subjects = JSON.parse(localStorage.getItem('subjects') || '[]');
    subjects.push(name);
    localStorage.setItem('subjects', JSON.stringify(subjects));
    loadSubjects();
    showToast('تمت إضافة المادة');
  }
};

// Open subject
function openSubject(name) {
  currentSubject = name;
  subjectTitle.innerText = name;
  homeScreen.classList.remove('active');
  subjectScreen.classList.add('active');
  loadTabData();
}

// Back to home
backBtn.onclick = () => {
  subjectScreen.classList.remove('active');
  homeScreen.classList.add('active');
  loadSubjects();
};

// Switch tabs
tabBtns.forEach(btn => {
  btn.onclick = () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    tabContents.forEach(c => c.style.display = 'none');
    document.getElementById(currentTab).style.display = 'block';
    loadTabData();
  };
});

// Load data for current tab
function loadTabData() {
  if (!currentSubject) return;
  const data = JSON.parse(localStorage.getItem(currentSubject+'-'+currentTab) || '[]');
  if (currentTab==='notes') {
    const list = document.getElementById('notesList');
    list.innerHTML = '';
    data.forEach((note,i)=>{
      const li=document.createElement('li');
      li.textContent=note;
      list.appendChild(li);
    });
  }
  else if (currentTab==='files') {
    const list = document.getElementById('filesList');
    list.innerHTML = '';
    data.forEach((file,i)=>{
      const li=document.createElement('li');
      li.innerHTML = `<a href="${file}" target="_blank">📂 ملف ${i+1}</a>`;
      list.appendChild(li);
    });
  }
  else if (currentTab==='images') {
    imagesGrid.innerHTML = '';
    data.forEach((src,i)=>{
      const img=document.createElement('img');
      img.src=src;
      img.onclick=()=>{ modal.style.display='block'; modalImg.src=src; };
      imagesGrid.appendChild(img);
    });
  }
  else if (currentTab==='audio') {
    const list = document.getElementById('audioList');
    list.innerHTML='';
    data.forEach((src,i)=>{
      const li=document.createElement('li');
      li.innerHTML=`<audio controls src="${src}"></audio>`;
      list.appendChild(li);
    });
  }
}

// Add item
addItemBtn.onclick = () => {
  if (!currentSubject) return;
  let input;
  if (currentTab==='notes') {
    input=prompt('أدخل الملاحظة:');
  } else if (currentTab==='files') {
    input=prompt('أدخل رابط الملف:');
  } else if (currentTab==='images') {
    input=prompt('أدخل رابط الصورة:');
  } else if (currentTab==='audio') {
    input=prompt('أدخل رابط الصوت:');
  }
  if (input) {
    const key=currentSubject+'-'+currentTab;
    const data=JSON.parse(localStorage.getItem(key) || '[]');
    data.push(input);
    localStorage.setItem(key,JSON.stringify(data));
    loadTabData();
    showToast('تمت الإضافة');
  }
};

// Modal close
closeModal.onclick = ()=>{ modal.style.display='none'; };
window.onclick = (e)=>{ if (e.target==modal) modal.style.display='none'; };

// init
loadSubjects();
