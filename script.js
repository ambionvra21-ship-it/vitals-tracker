let healthChartInstance = null;
let activeAlarmsArray = JSON.parse(localStorage.getItem('healthAlarms')) || [];
let targetChallengeTier = parseInt(localStorage.getItem('challengeTier')) || 30;

// 1. Calculate BMI Score 
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    if (!weight || !heightCm) { alert("Please complete weight and height fields."); return; }
    const heightM = heightCm / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);
    document.getElementById('bmiValue').innerText = bmi;
    let status = "", colorClass = "";
    if (bmi < 18.5) { status = "Underweight"; colorClass = "text-yellow-600"; }
    else if (bmi < 24.9) { status = "Normal Weight"; colorClass = "text-green-600"; }
    else if (bmi < 29.9) { status = "Overweight"; colorClass = "text-orange-600"; }
    else { status = "Obesity"; colorClass = "text-red-600"; }
    const statusEl = document.getElementById('bmiStatus');
    statusEl.innerText = status;
    statusEl.className = `text-xs font-semibold mt-1 ${colorClass}`;
    document.getElementById('bmiResult').classList.remove('hidden');
    return bmi;
}

// 2. Log Vitals to LocalStorage
function logVitals() {
    const bpSys = document.getElementById('bpSys').value;
    const bpDia = document.getElementById('bpDia').value;
    const sugar = document.getElementById('sugar').value;
    const pulse = document.getElementById('pulse').value;
    const currentBmi = document.getElementById('bmiValue').innerText !== "0.0" ? document.getElementById('bmiValue').innerText : "";
    const today = new Date();
    const logEntry = {
        dateStr: today.toLocaleDateString(),
        timeStr: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dayNum: today.getDate(),
        bmi: currentBmi || "—",
        bp: (bpSys && bpDia) ? `${bpSys}/${bpDia}` : "—",
        bpSysNum: bpSys ? parseInt(bpSys) : null,
        sugarNum: sugar ? parseInt(sugar) : null,
        pulseNum: pulse ? parseInt(pulse) : null
    };
    let logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    logs.unshift(logEntry);
    localStorage.setItem('healthLogs', JSON.stringify(logs));
    ['bpSys', 'bpDia', 'sugar', 'pulse'].forEach(id => document.getElementById(id).value = '');
    updateDashboardView();
}

// 3. Log Expense Item Tracking
function logExpense() {
    const label = document.getElementById('expLabel').value;
    const cost = parseFloat(document.getElementById('expCost').value);
    if (!label || !cost) { alert("Please complete expense item description and cost fields."); return; }
    const expenseEntry = { dateStr: new Date().toLocaleDateString(), label, cost: cost.toFixed(2) };
    let expenses = JSON.parse(localStorage.getItem('healthExpenses')) || [];
    expenses.unshift(expenseEntry);
    localStorage.setItem('healthExpenses', JSON.stringify(expenses));
    document.getElementById('expLabel').value = '';
    document.getElementById('expCost').value = '';
    updateDashboardView();
}

// 4. Track Multi-Tier Challenge System
function setChallengeTier(days) {
    targetChallengeTier = days;
    localStorage.setItem('challengeTier', days);
    [30, 60, 90].forEach(d => {
        const btn = document.getElementById(`tierBtn${d}`);
        if(btn) {
            if(d === days) {
                btn.className = "py-1 px-2 rounded text-xs font-bold bg-yellow-500 text-white shadow-sm";
            } else {
                btn.className = "py-1 px-2 rounded text-xs font-bold bg-gray-200 text-gray-700 hover:bg-gray-300";
            }
        }
    });
    const labelEl = document.getElementById('targetTierLabel');
    if(labelEl) labelEl.innerText = `${days} Days`;
    updateChallengeStreak();
}

function updateChallengeStreak() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const countEl = document.getElementById('streakCount');
    const progressEl = document.getElementById('streakProgress');
    const milestoneEl = document.getElementById('challengeMilestone');
    
    if (!logs.length) {
        if(countEl) countEl.innerText = "0";
        if(progressEl) progressEl.style.width = "0%";
        return;
    }
    const uniqueDates = [...new Set(logs.map(l => l.dateStr))].map(d => new Date(d));
    uniqueDates.sort((a,b) => b - a);
    let streak = 0;
    let today = new Date(); today.setHours(0,0,0,0);
    let checkDate = new Date(uniqueDates[0]); checkDate.setHours(0,0,0,0);
    const diffDays = Math.ceil(Math.abs(today - checkDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            let prev = new Date(uniqueDates[i]); prev.setHours(0,0,0,0);
            if ((checkDate - prev) / (1000 * 60 * 60 * 24) === 1) { streak++; checkDate = prev; } 
            else if ((checkDate - prev) / (1000 * 60 * 60 * 24) > 1) { break; }
        }
    }
    if(countEl) countEl.innerText = `${streak}`;
    const percentage = Math.min((streak / targetChallengeTier) * 100, 100);
    if(progressEl) progressEl.style.width = `${percentage}%`;
    if(milestoneEl) {
        if (streak >= targetChallengeTier) milestoneEl.innerText = `🏆 Phenomenal! You achieved your ${targetChallengeTier}-Day Goal!`;
        else milestoneEl.innerText = `Keep it going! You are ${targetChallengeTier - streak} consecutive tracking days away.`;
    }
}

// 5. Render Chart Layout
function renderChart() {
    const logs = [...(JSON.parse(localStorage.getItem('healthLogs')) || [])].reverse();
    const canvasElement = document.getElementById('healthChart');
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    const labels = logs.map(l => l.dateStr);
    if (healthChartInstance) { healthChartInstance.destroy(); }
    healthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Logs'],
            datasets: [
                { label: 'Sugar', data: logs.map(l => l.sugarNum), borderColor: '#0D9488', backgroundColor: '#0D9488', tension: 0.2, fill: false },
                { label: 'Pulse', data: logs.map(l => l.pulseNum), borderColor: '#F43F5E', backgroundColor: '#F43F5E', tension: 0.2, fill: false },
                { label: 'BP Systolic', data: logs.map(l => l.bpSysNum), borderColor: '#2563EB', backgroundColor: '#2563EB', tension: 0.2, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 6. Render Calendar Component
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calendarMonthLabel');
    if (!grid || !label) return;
    grid.innerHTML = '';
    const now = new Date();
    label.innerText = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const loggedDays = (JSON.parse(localStorage.getItem('healthLogs')) || []).filter(l => new Date(l.dateStr).getMonth() === now.getMonth()).map(l => l.dayNum);
    for (let i = 0; i < firstDayIndex; i++) { grid.innerHTML += `<div></div>`; }
    for (let day = 1; day <= totalDays; day++) {
        const circleStyle = loggedDays.includes(day) ? 'bg-emerald-500 text-white rounded-full font-bold' : 'text-gray-700 hover:bg-gray-100 rounded-md';
        grid.innerHTML += `<div class="p-1 flex items-center justify-center h-8 w-8 mx-auto ${circleStyle}">${day}</div>`;
    }
}

// 7. Share Handler
function sharePlatform(p) {
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this free Vitals Tracker app!");
    if (p === 'copy') { navigator.clipboard.writeText(window.location.href); alert("Copied!"); return; }
    let url = p === 'facebook' ? `https://facebook.com{pageUrl}` : p === 'twitter' ? `https://twitter.com{pageUrl}&text=${text}` : `https://whatsapp.com{text}%20${pageUrl}`;
    window.open(url, '_blank', 'width=600,height=400');
}

// 8. Alarm Processing Logic
function setAlarm() {
    const label = document.getElementById('alarmLabel').value || "Health Alarm!";
    const time = document.getElementById('alarmTime').value;
    if (!time) { alert("Please provide a valid time configuration."); return; }
    activeAlarmsArray.push({ label, time, triggered: false });
    localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray));
    document.getElementById('alarmLabel').value = '';
    renderAlarmsList();
}

function renderAlarmsList() {
    const container = document.getElementById('activeAlarms');
    if (!container) return;
    container.innerHTML = '';
    if(!activeAlarmsArray.length) { container.innerHTML = '<p class="text-gray-400 italic">No reminders set.</p>'; return; }
    activeAlarmsArray.forEach((alarm, i) => {
        container.innerHTML += `<div class="flex justify-between items-center p-2 bg-purple-50 rounded text-purple-900 border border-purple-100"><span>🔔 <strong>${alarm.time}</strong> - ${alarm.label}</span><button onclick="deleteAlarm(${i})" class="text-red-500 font-bold">✕</button></div>`;
    });
}

function deleteAlarm(i) { activeAlarmsArray.splice(i, 1); localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray)); renderAlarmsList(); }

setInterval(() => {
    const currentClockTime = new Date().toTimeString().slice(0,5);
    activeAlarmsArray.forEach(alarm => {
        if(alarm.time === currentClockTime && !alarm.triggered) {
            const soundElement = document.getElementById('alarmSound');
            if (soundElement) {
                soundElement.play().catch(e => console.log("Audio awaiting gesture."));
            }
