let healthChartInstance = null;
let activeAlarmsArray = JSON.parse(localStorage.getItem('healthAlarms')) || [];
let targetChallengeTier = parseInt(localStorage.getItem('challengeTier')) || 30;
let totalWaterLogged = parseInt(localStorage.getItem('waterToday')) || 0;

// 1. Math Calculator Operations
function pressCalc(val) {
    const display = document.getElementById('calcDisplay');
    if(display) {
        if(display.value === '0' || display.value === 'Error') display.value = val;
        else display.value += val;
    }
}
function clearCalc() {
    const display = document.getElementById('calcDisplay');
    if(display) display.value = '0';
}
function evalCalc() {
    const display = document.getElementById('calcDisplay');
    if(display) {
        try { display.value = eval(display.value); }
        catch(e) { display.value = 'Error'; }
    }
}

// 2. Hydration Operations
function addWater(amount) {
    totalWaterLogged += amount;
    localStorage.setItem('waterToday', totalWaterLogged);
    const element = document.getElementById('totalWaterLabel');
    if(element) element.innerText = `${totalWaterLogged} ml`;
}

// 3. Nutrition Operations
function logDiet() {
    const label = document.getElementById('dietLabel')?.value || "Meal Entry";
    const kcal = parseInt(document.getElementById('dietKcal')?.value);
    if (!kcal) { alert("Please complete the calorie count field."); return; }
    
    let diets = JSON.parse(localStorage.getItem('healthDiets')) || [];
    diets.unshift({ dateStr: new Date().toLocaleDateString(), label, kcal });
    localStorage.setItem('healthDiets', JSON.stringify(diets));
    
    if(document.getElementById('dietLabel')) document.getElementById('dietLabel').value = '';
    if(document.getElementById('dietKcal')) document.getElementById('dietKcal').value = '';
    updateDashboardView();
}

// 4. Calculate BMI Score
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

// 5. Log Vitals
function logVitals() {
    const bpSys = document.getElementById('bpSys').value;
    const bpDia = document.getElementById('bpDia').value;
    const sugar = document.getElementById('sugar').value;
    const pulse = document.getElementById('pulse').value;
    const bmi = document.getElementById('bmiValue').innerText !== "0.0" ? document.getElementById('bmiValue').innerText : "—";
    const today = new Date();
    
    let logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    logs.unshift({
        dateStr: today.toLocaleDateString(),
        timeStr: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bmi: bmi,
        bp: (bpSys && bpDia) ? `${bpSys}/${bpDia}` : "—",
        bpSysNum: bpSys ? parseInt(bpSys) : null,
        sugarNum: sugar ? parseInt(sugar) : null,
        pulseNum: pulse ? parseInt(pulse) : null
    });
    localStorage.setItem('healthLogs', JSON.stringify(logs));
    ['bpSys', 'bpDia', 'sugar', 'pulse'].forEach(id => document.getElementById(id).value = '');
    updateDashboardView();
}

// 6. Log Expense
function logExpense() {
    const label = document.getElementById('expLabel')?.value || "Medical Expense";
    const cost = parseFloat(document.getElementById('expCost').value);
    if (!cost) { alert("Please complete expense item logs fields."); return; }
    let expenses = JSON.parse(localStorage.getItem('healthExpenses')) || [];
    expenses.unshift({ dateStr: new Date().toLocaleDateString(), label, cost: cost.toFixed(2) });
    localStorage.setItem('healthExpenses', JSON.stringify(expenses));
    if(document.getElementById('expLabel')) document.getElementById('expLabel').value = '';
    document.getElementById('expCost').value = '';
    updateDashboardView();
}

// 7. Habit Streak System Tiers (FIXED Syntax Error Array Binding)
function setChallengeTier(days) {
    targetChallengeTier = days;
    localStorage.setItem('challengeTier', days);
    
    let tiers =;
    tiers.forEach(d => {
        const btn = document.getElementById(`tierBtn${d}`);
        if(btn) {
            btn.style.backgroundColor = d === days ? '#f59e0b' : '#e5e7eb';
            btn.style.color = d === days ? 'white' : '#374151';
        }
    });
    const labelEl = document.getElementById('targetTierLabel');
    if (labelEl) labelEl.innerText = `${days} Days`;
    updateChallengeStreak();
}

// 8. Streak Logic Counter
function updateChallengeStreak() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const countEl = document.getElementById('streakCount');
    const progressEl = document.getElementById('streakProgress');
    if (!countEl || !progressEl) return;
    if (!logs.length) { countEl.innerText = "0"; progressEl.style.width = "0%"; return; }
    
    let streak = 1; 
    countEl.innerText = `${streak}`;
    progressEl.style.width = `${Math.min((streak / targetChallengeTier) * 100, 100)}%`;
}

// 9. Render Calendar Visuals
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
        const circleStyle = loggedDays.includes(day) ? 'background-color:#10b981; color:white; border-radius:50%; font-weight:bold;' : 'color:#374151;';
        grid.innerHTML += `<div style="padding:6px; display:flex; align-items:center; justify-content:center; height:24px; width:24px; margin:auto; ${circleStyle}">${day}</div>`;
    }
}

// 10. Trendline Graphs Analytics
function renderChart() {
    const logs = [...(JSON.parse(localStorage.getItem('healthLogs')) || [])].reverse();
    const canvas = document.getElementById('healthChart');
    if(!canvas) return;
    if (healthChartInstance) { healthChartInstance.destroy(); }
    healthChartInstance = new Chart(canvas.getContext('2d'), {
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

// 11. Alarm Reminders Controls
function setAlarm() {
    const time = document.getElementById('alarmTime').value;
    if (!time) { alert("Please provide an alarm trigger time."); return; }
    activeAlarmsArray.push({ label: "Health Check Alert!", time, triggered: false });
    localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray));
    renderAlarmsList();
}
function renderAlarmsList() {
    const container = document.getElementById('activeAlarms');
    if(!container) return; container.innerHTML = '';
    activeAlarmsArray.forEach((alarm, i) => {
        container.innerHTML += `<div style="display:flex; justify-content:space-between; background:#faf5ff; padding:8px; border-radius:4px; margin-top:4px; font-size:12px; border:1px solid #f3e8ff;"><span>🔔 <strong>${alarm.time}</strong> - ${alarm.label}</span><button onclick="deleteAlarm(${i})" style="width:auto; margin:0; padding:2px 6px; background:#ef4444; border:none; color:white; border-radius:4px; cursor:pointer;">✕</button></div>`;
    });
}
function deleteAlarm(i) { activeAlarmsArray.splice(i,1); localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray)); renderAlarmsList(); }

setInterval(() => {
    const currentClockTime = new Date().toTimeString().slice(0,5);
    activeAlarmsArray.forEach(alarm => {
        if(alarm.time === currentClockTime && !alarm.triggered) {
            const audio = document.getElementById('alarmSound');
            if(audio) audio.play().catch(e => console.log('Audio waiting for touch activation...'));
            alert(`⏰ REMINDER: ${alarm.label}`); alarm.triggered = true;
        }
        if(alarm.time !== currentClockTime) { alarm.triggered = false; }
    });
}, 1000);

// 12. Social Sharing Utilities
function sharePlatform(p) {
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Track your BMI, health vitals and water tracking goals privately using VitalsTracker Pro!");
