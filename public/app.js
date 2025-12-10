(async function(){
  // Tabs
  const tabComplaints = document.getElementById('tab-complaints');
  const tabCompliments = document.getElementById('tab-compliments');
  const complaintsView = document.getElementById('complaints-view');
  const complimentsView = document.getElementById('compliments-view');

  tabComplaints.onclick = () => {
    tabComplaints.classList.add('active'); tabCompliments.classList.remove('active');
    complaintsView.classList.remove('hidden'); complimentsView.classList.add('hidden');
  };
  tabCompliments.onclick = () => {
    tabCompliments.classList.add('active'); tabComplaints.classList.remove('active');
    complimentsView.classList.remove('hidden'); complaintsView.classList.add('hidden');
    loadCompliments();
  };

  // Helpers
  const el = (id)=>document.getElementById(id);
  const api = (p, opts)=>fetch(p, opts).then(r=>r.ok?r.json():r.json().then(e=>Promise.reject(e)));

  // Complaints: list & form
  async function loadComplaints(){
    el('complaints-list').textContent = 'Loading...';
    try{
      const data = await api('/api/complaints');
      if(!data.length) el('complaints-list').innerHTML = '<div class="meta">No complaints yet.</div>';
      else el('complaints-list').innerHTML = data.map(c=>`
        <div class="list-item">
          <strong>${escapeHtml(c.title)}</strong>
          <div class="meta">${escapeHtml(c.customer_name)} • ${new Date(c.created_at).toLocaleString()} • ${escapeHtml(c.status)} • ${escapeHtml(c.priority)}</div>
          <p>${escapeHtml(c.description)}</p>
        </div>`).join('');
    }catch(err){
      el('complaints-list').innerHTML = `<div class="meta">Error loading: ${escapeErr(err)}</div>`;
    }
  }

  document.getElementById('complaint-form').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const form = ev.target;
    const body = Object.fromEntries(new FormData(form).entries());
    try{
      await api('/api/complaints', {method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});
      form.reset();
      loadComplaints();
      alert('Complaint submitted');
    }catch(err){
      alert('Submit failed: '+(err.error||JSON.stringify(err)));
    }
  });

  // Compliments: list & form
  async function loadCompliments(){
    el('compliments-list').textContent = 'Loading...';
    try{
      const data = await api('/api/compliments');
      if(!data.length) el('compliments-list').innerHTML = '<div class="meta">No compliments yet.</div>';
      else el('compliments-list').innerHTML = data.map(c=>`
        <div class="list-item">
          <p>${escapeHtml(c.message)}</p>
          <div class="meta">${escapeHtml(c.recipient)} ← ${escapeHtml(c.sender||'Anonymous')} • ${new Date(c.created_at).toLocaleString()}</div>
        </div>`).join('');
    }catch(err){
      el('compliments-list').innerHTML = `<div class="meta">Error loading: ${escapeErr(err)}</div>`;
    }
  }

  document.getElementById('compliment-form').addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const form = ev.target;
    const body = Object.fromEntries(new FormData(form).entries());
    try{
      await api('/api/compliments', {method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});
      form.reset();
      loadCompliments();
      alert('Compliment sent');
    }catch(err){
      alert('Send failed: '+(err.error||JSON.stringify(err)));
    }
  });

  // Utilities
  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }
  function escapeErr(e){ try{ return e.error || JSON.stringify(e); }catch(x){return String(e)} }

  // Initial load
  loadComplaints();
  // compliments load on demand when tab clicked
})();
