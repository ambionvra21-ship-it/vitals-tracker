let healthChartInstance = null;
let activeAlarmsArray = JSON.parse(localStorage.getItem('healthAlarms')) || [];
let targetChallengeTier = parseInt(localStorage.getItem('challengeTier')) || 30;
let totalWaterLogged = parseInt(localStorage.getItem('waterToday')) || 0;

// 1. Water Intake Processing Logic
function addWater(amount) {
    totalWaterLogged += amount;
    localStorage.setItem('waterToday', totalWaterLogged);
    const element = document.getElementById('totalWaterLabel');
    if(element) element.innerText = `${totalWaterLogged} ml`;
}

// 2. Log Nutrition Entry
function logDiet() {
    const label = document.getElementById('dietLabel')?.value || "Diet Entry";
    const kcal = parseInt(document.getElementById('dietKcal')?.value);
    if (!kcal) { alert("Please complete the calorie count field."); return; }
    const entry = { dateStr: new Date().toLocaleDateString(), label, kcal };
    let diets = JSON.parse(localStorage.getItem('healthDiets')) || [];
    diets.unshift(entry);
    localStorage.setItem('healthDiets', JSON.stringify(diets));
    
    const labelInput = document.getElementById('dietLabel');
    const kcalInput = document.getElementById('dietKcal');
    if(labelInput) labelInput.value = '';
    if(kcalInput) kcalInput.value = '';
    updateDashboardView();
}

// 3. Calculate BMI Score 
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    if (!weight || !heightCm) { alert("Please complete weight and height fields."); return; }
    const bmi = (weight / ((heightCm / 100) * (heightCm / 100))).toFixed(1);
    document.getElementById('bmiValue').innerText = bmi;
    let status = "", colorClass = "";
    if (bmi < 18.5) { status = "Underweight"; colorClass = "text-yellow-600"; }
    else if (bmi < 24.9) { status = "Normal Weight"; colorClass = "text-green-600"; }
    else if (bmi < 29.9) { status = "Overweight"; colorClass = "text-orange-600"; }
    else { status = "Obesity"; colorClass = "text-red-600"; }
    const statusEl = document.getElementById('bmiStatus');
    statusEl.innerText = status;
    statusEl.className = `text-xs font-semibold mt-1 ${colorClass}`;
    document.getElementById('bmiResult').style.display = 'block';
    return bmi;
}

// 4. Log Vitals
function logVitals() {
    const bpSys = document.getElementById('bpSys').value;
    const bpDia = document.getElementById('bpDia').value;
    const sugar = document.getElementById('sugar').value;
    const pulse = document.getElementById('pulse').value;
    const bmi = document.getElementById('bmiValue').innerText !== "0.0" ? document.getElementById('bmiValue').innerText : "—";
    const today = new Date();
    const entry = {
        dateStr: today.toLocaleDateString(),
        timeStr: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bmi: bmi,
        bp: (bpSys && bpDia) ? `${bpSys}/${bpDia}` : "—",
        bpSysNum: bpSys ? parseInt(bpSys) : null,
        sugarNum: sugar ? parseInt(sugar) : null,
        pulseNum: pulse ? parseInt(pulse) : null
    };
    let logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    logs.unshift(entry);
    localStorage.setItem('healthLogs', JSON.stringify(logs));
    ['bpSys', 'bpDia', 'sugar', 'pulse'].forEach(id => document.getElementById(id).value = '');
    updateDashboardView();
}

// 5. Log Expense
function logExpense() {
    const label = document.getElementById('expLabel').value;
    const cost = parseFloat(document.getElementById('expCost').value);
    if (!label || !cost) { alert("Please enter description and cost fields."); return; }
    let expenses = JSON.parse(localStorage.getItem('healthExpenses')) || [];
    expenses.unshift({ dateStr: new Date().toLocaleDateString(), label, cost: cost.toFixed(2) });
    localStorage.setItem('healthExpenses', JSON.stringify(expenses));
    document.getElementById('expLabel').value = '';
    document.getElementById('expCost').value = '';
    updateDashboardView();
}

// 6. Challenge Engine
function setChallengeTier(days) {
    targetChallengeTier = days;
    localStorage.setItem('challengeTier', days);
    [30, 60, 90].forEach(d => {
        const btn = document.getElementById(`tierBtn${d}`);
        if(btn) btn.style.backgroundColor = d === days ? '#f59e0b' : '#e5e7eb';
        if(btn) btn.style.color = d === days ? 'white' : '#374151';
    });
    document.getElementById('targetTierLabel').innerText = `${days} Days`;
    updateChallengeStreak();
}

function updateChallengeStreak() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const countEl = document.getElementById('streakCount');
    const progressEl = document.getElementById('streakProgress');
    if (!countEl || !progressEl) return;

    if (!logs.length) {
        countEl.innerText = "0";
        progressEl.style.width = "0%";
        return;
    }
    const uniqueDates = [...new Set(logs.map(l => l.dateStr))].map(d => new Date(d)).sort((a,b) => b - a);
    let streak = 1; // Basic fallback counter format
    countEl.innerText = `${streak}`;
    const percentage = Math.min((streak / targetChallengeTier) * 100, 100);
    progressEl.style.width = `${percentage}%`;
}

// 7. Render Trends Chart
function renderChart() {
    const logs = [...(JSON.parse(localStorage.getItem('healthLogs')) || [])].reverse();
    const canvas = document.getElementById('healthChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (healthChartInstance) { healthChartInstance.destroy(); }
    healthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: logs.map(l => l.dateStr).length ? logs.map(l => l.dateStr) : ['No Data'],
            datasets: [
                { label: 'Sugar', data: logs.map(l => l.sugarNum), borderColor: '#0D9488', tension: 0.2, fill: false },
                { label: 'Pulse', data: logs.map(l => l.pulseNum), borderColor: '#F43F5E', tension: 0.2, fill: false },
                { label: 'BP Systolic', data: logs.map(l => l.bpSysNum), borderColor: '#2563EB', tension: 0.2, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 8. Sharing Widget Utilities
function sharePlatform(p) {
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Track your BMI, health vitals and dietary routines privately using VitalsTracker Pro!");
    if(p === 'copy') { navigator.clipboard.writeText(window.location.href); alert("Website URL Copied!"); return; }
    let url = p === 'facebook' ? `https://facebook.com{pageUrl}` : p === 'twitter' ? `https://twitter.com{pageUrl}&text=${text}` : `https://whatsapp.com{text}%20${pageUrl}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// 9. Reminders Alarm Logic
function setAlarm() {
    const label = document.getElementById('alarmLabel').value || "Health Check Alert!";
    const time = document.getElementById('alarmTime').value;
    if (!time) { alert("Please provide an alarm alert time."); return; }
    activeAlarmsArray.push({ label, time, triggered: false });
    localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray));
    document.getElementById('alarmLabel').value = '';
    renderAlarmsList();
}

function renderAlarmsList() {
    const container = document.getElementById('activeAlarms');
    if(!container) return; container.innerHTML = '';
    activeAlarmsArray.forEach((alarm, i) => {
        container.innerHTML += `<div style="display:flex; justify-content:space-between; background:#faf5ff; padding:8px; border-radius:4px; margin-top:4px; font-size:12px; border:1px solid #f3e8ff;"><span>🔔 <strong>${alarm.time}</strong> - ${alarm.label}</span><button onclick="deleteAlarm(${i})" style="width:auto; margin:0; padding:2px 6px; background:#ef4444; color:white; border:none; border-radius:4px; cursor:pointer;">✕</button></div>`;
    });
}
function deleteAlarm(i) { activeAlarmsArray.splice(i,1); localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray)); renderAlarmsList(); }

// 10. Master Layout Sync Refresh Engine
function updateDashboardView() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const tbody = document.getElementById('logTableBody');
    if(tbody) {
        tbody.innerHTML = logs.length ? '' : '<tr><td colspan="5" style="padding:10px; text-align:center; color:#9ca3af;">No health metrics recorded yet.</td></tr>';
        logs.forEach(log => {
            tbody.innerHTML += `<tr><td>${log.dateStr} | ${log.timeStr}</td><td><strong>${log.bmi}</strong></td><td>${log.bp}</td><td>${log.sugarNum ? log.sugarNum + ' mg/dL' : '—'}</td><td>${log.pulseNum ? log.pulseNum + ' BPM' : '—'}</td></tr>`;
        });
    }

    const expenses = JSON.parse(localStorage.getItem('healthExpenses')) || [];
    const expTbody = document.getElementById('expenseTableBody');
    if(expTbody) {
        let outlay = 0; expTbody.innerHTML = expenses.length ? '' : '<tr><td colspan="3" style="padding:10px; text-align:center; color:#9ca3af;">No expense entries saved yet.</td></tr>';
        expenses.forEach(e => { outlay += parseFloat(e.cost); expTbody.innerHTML += `<tr><td>${e.dateStr}</td><td>${e.label}</td><td><strong>$${e.cost}</strong></td></tr>`; });
        const outlayLabel = document.getElementById('totalExpenseVal');
        if(outlayLabel) outlayLabel.innerText = `$${outlay.toFixed(2)}`;
    }

    const diets = JSON.parse(localStorage.getItem('healthDiets')) || [];
    const dietTbody = document.getElementById('dietTableBody');
    if(dietTbody) {
        dietTbody.innerHTML = diets.length ? '' : '<tr><td colspan="3" style="padding:10px; text-align:center; color:#9ca3af;">No nutrition logs entries saved yet.</td></tr>';
