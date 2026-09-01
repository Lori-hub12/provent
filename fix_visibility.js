const fs=require('fs'); 
let f=fs.readFileSync('dashboard-empresa.html','utf8'); 
f=f.replace('id="pasaportes" class="dashboard-section" style="display:none;"', 'id="pasaportes" class="dashboard-section" style="display:block; margin-top:5rem; padding-top:3rem; border-top:1px solid #E2E8F0;"'); 
fs.writeFileSync('dashboard-empresa.html',f);
