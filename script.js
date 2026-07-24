let healthChartInstance = null;
let activeAlarmsArray = JSON.parse(localStorage.getItem('healthAlarms')) || [];

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

// 3. Track Streak and Challenge Progress
function updateChallengeStreak() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    if (!logs.length) {
        document.getElementById('streakCount').innerText = "0";
        document.getElementById('streakProgress').style.width = "0%";
        return;
    }

    const uniqueDates = [...new Set(logs.map(l => l.dateStr))].map(d => new Date(d));
    uniqueDates.sort((a,b) => b - a);

    let streak = 0;
    let today = new Date();
    today.setHours(0,0,0,0);
    
    let checkDate = new Date(uniqueDates[0]);
    checkDate.setHours(0,0,0,0);

    const diffTime = Math.abs(today - checkDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
        streak = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            let prev = new Date(uniqueDates[i]);
            prev.setHours(0,0,0,0);
            let dayGap = (checkDate - prev) / (1000 * 60 * 60 * 24);
            if (dayGap === 1) {
                streak++;
                checkDate = prev;
            } else if (dayGap > 1) {
                break;
            }
        }
    }

    document.getElementById('streakCount').innerText = `${streak}`;
    const percentage = Math.min((streak / 30) * 100, 100);
    document.getElementById('streakProgress').style.width = `${percentage}%`;

    const statusMsg = document.getElementById('challengeMilestone');
    if (streak >= 30) statusMsg.innerText = "🏆 Incredible! You completed the 30-Day Health Challenge!";
    else if (streak > 0) statusMsg.innerText = `Keep it going! You are ${30 - streak} days away from your goal.`;
}

// 4. Render Custom Styled Chart (Chart.js)
function renderChart() {
    const logs = [...(JSON.parse(localStorage.getItem('healthLogs')) || [])].reverse();
    const canvasElement = document.getElementById('healthChart');
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');

    const labels = logs.map(l => l.dateStr);
    const sugarData = logs.map(l => l.sugarNum);
    const pulseData = logs.map(l => l.pulseNum);
    const bpSysData = logs.map(l => l.bpSysNum);

    if (healthChartInstance) { healthChartInstance.destroy(); }

    healthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Logs'],
            datasets: [
                { label: 'Sugar', data: sugarData, borderColor: '#0D9488', backgroundColor: '#0D9488', tension: 0.2, fill: false },
                { label: 'Pulse', data: pulseData, borderColor: '#F43F5E', backgroundColor: '#F43F5E', tension: 0.2, fill: false },
                { label: 'BP Systolic', data: bpSysData, borderColor: '#2563EB', backgroundColor: '#2563EB', tension: 0.2, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 5. Render Calendar Visuals
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calendarMonthLabel');
    if (!grid || !label) return;
    grid.innerHTML = '';
    
    const now = new Date();
    label.innerText = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const loggedDays = logs.filter(l => new Date(l.dateStr).getMonth() === now.getMonth()).map(l => l.dayNum);

    for (let i = 0; i < firstDayIndex; i++) { grid.innerHTML += `<div></div>`; }

    for (let day = 1; day <= totalDays; day++) {
        const isLogged = loggedDays.includes(day);
        const circleStyle = isLogged ? 'bg-emerald-500 text-white rounded-full font-bold' : 'text-gray-700 hover:bg-gray-100 rounded-md';
        grid.innerHTML += `<div class="p-1 flex items-center justify-center h-8 w-8 mx-auto ${circleStyle}">${day}</div>`;
    }
}

// 6. Social Media Sharing
function sharePlatform(platform) {
    const pageUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this free Vitals Tracker app to monitor your health trends privately!");
    let targetUrl = "";
    if (platform === 'facebook') targetUrl = `https://facebook.com{pageUrl}`;
    else if (platform === 'twitter') targetUrl = `https://twitter.com{pageUrl}&text=${text}`;
    else if (platform === 'whatsapp') targetUrl = `https://whatsapp.com{text}%20${pageUrl}`;
    else if (platform === 'copy') {
        navigator.clipboard.writeText(window.location.href);
        alert("App link copied!");
        return;
    }
    window.open(targetUrl, '_blank', 'width=600,height=400');
}

// 7. System Health Alarm Controls
function setAlarm() {
    const label = document.getElementById('alarmLabel').value || "Health Check Alert!";
    const time = document.getElementById('alarmTime').value;
    if (!time) { alert("Please specify a valid time."); return; }

    activeAlarmsArray.push({ label, time, triggered: false });
    localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray));
    document.getElementById('alarmLabel').value = '';
    renderAlarmsList();
}

function renderAlarmsList() {
    const container = document.getElementById('activeAlarms');
    if (!container) return;
    container.innerHTML = '';
    if(!activeAlarmsArray.length) { container.innerHTML = '<p class="text-gray-400 italic">No reminders.</p>'; return; }

    activeAlarmsArray.forEach((alarm, index) => {
        container.innerHTML += `
            <div class="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-100 text-purple-900">
                <span>🔔 <strong>${alarm.time}</strong> - ${alarm.label}</span>
                <button onclick="deleteAlarm(${index})" class="text-red-500 hover:text-red-700 font-bold">✕</button>
            </div>`;
    });
}

function deleteAlarm(index) {
    activeAlarmsArray.splice(index, 1);
    localStorage.setItem('healthAlarms', JSON.stringify(activeAlarmsArray));
    renderAlarmsList();
}

setInterval(() => {
    const now = new Date();
    const currentClockTime = now.toTimeString().slice(0,5);
    activeAlarmsArray.forEach(alarm => {
        if(alarm.time === currentClockTime && !alarm.triggered) {
            const soundElement = document.getElementById('alarmSound');
            if (soundElement) {
                soundElement.play().catch(e => console.log("Audio waiting for user tap interaction."));
            }
            alert(`⏰ REMINDER: ${alarm.label}`);
            alarm.triggered = true;
        }
        if(alarm.time !== currentClockTime) { alarm.triggered = false; }
    });
}, 1000);

// 8. Update Master Screen View
function updateDashboardView() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const tbody = document.getElementById('logTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">No health records saved yet.</td></tr>`;
    } else {
        logs.forEach(log => {
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3 text-xs text-gray-400">${log.dateStr} | ${log.timeStr}</td>
                    <td class="p-3 font-semibold text-blue-600">${log.bmi}</td>
