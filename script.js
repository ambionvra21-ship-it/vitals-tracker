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

    // Clear UI Fields
    ['bpSys', 'bpDia', 'sugar', 'pulse'].forEach(id => document.getElementById(id).value = '');
    
    updateDashboardView();
}

// 3. Setup and Update Interactive Analytics (Chart.js)
function renderChart() {
    const logs = [...(JSON.parse(localStorage.getItem('healthLogs')) || [])].reverse(); // oldest first for charts
    const ctx = document.getElementById('healthChart').getContext('2d');

    const labels = logs.map(l => l.dateStr);
    const sugarData = logs.map(l => l.sugarNum);
    const pulseData = logs.map(l => l.pulseNum);
    const bpSysData = logs.map(l => l.bpSysNum);

    if (healthChartInstance) { healthChartInstance.destroy(); }

    healthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length ? labels : ['No Data Logged'],
            datasets: [
                { label: 'Sugar (mg/dL)', data: sugarData, borderColor: '#10B981', tension: 0.2, fill: false },
                { label: 'Pulse (BPM)', data: pulseData, borderColor: '#EF4444', tension: 0.2, fill: false },
                { label: 'BP Systolic', data: bpSysData, borderColor: '#3B82F6', tension: 0.2, fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } } }
    });
}

// 4. Render Calendar Visuals
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calendarMonthLabel');
    grid.innerHTML = '';
    
    const now = new Date();
    label.innerText = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const loggedDays = logs.filter(l => new Date(l.dateStr).getMonth() === now.getMonth()).map(l => l.dayNum);

    // Padding for blank days at start of month
    for (let i = 0; i < firstDayIndex; i++) {
        grid.innerHTML += `<div></div>`;
    }

    // Populate actual days
    for (let day = 1; day <= totalDays; day++) {
        const isLogged = loggedDays.includes(day);
        const circleStyle = isLogged ? 'bg-emerald-500 text-white rounded-full font-bold' : 'text-gray-700 hover:bg-gray-100 rounded-md';
        grid.innerHTML += `<div class="p-1 flex items-center justify-center h-8 w-8 mx-auto ${circleStyle}">${day}</div>`;
    }
}

// 5. System Health Alarm Controls
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
    container.innerHTML = '';
    
    if(!activeAlarmsArray.length) { container.innerHTML = '<p class="text-gray-400 italic">No reminders configured.</p>'; return; }

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

// Check every second if alarms are ringing
setInterval(() => {
    const now = new Date();
    const currentClockTime = now.toTimeString().slice(0,5); // "HH:MM"

    activeAlarmsArray.forEach(alarm => {
        if(alarm.time === currentClockTime && !alarm.triggered) {
            document.getElementById('alarmSound').play().catch(e => console.log("Audio waiting for user click interaction."));
            alert(`⏰ REMINDER: ${alarm.label}`);
            alarm.triggered = true; // prevent infinite loops inside this minute
        }
        if(alarm.time !== currentClockTime) { alarm.triggered = false; } // reset trigger status when minute rolls over
    });
}, 1000);

// 6. Update Master Screen Elements
function updateDashboardView() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';

    if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">No health records saved yet. Your daily log entries will display here.</td></tr>`;
    } else {
        logs.forEach(log => {
            tbody.innerHTML += `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="p-3 text-xs text-gray-400">${log.dateStr} <span class="text-gray-300">|</span> ${log.timeStr}</td>
                    <td class="p-3 font-semibold text-blue-600">${log.bmi}</td>
                    <td class="p-3 font-medium text-gray-700">${log.bp}</td>
                    <td class="p-3 text-gray-700">${log.sugarNum ? log.sugarNum + ' mg/dL' : '—'}</td>
                    <td class="p-3 text-gray-700">${log.pulseNum ? log.pulseNum + ' BPM' : '—'}</td>
                </tr>`;
        });
    }

    renderChart();
    renderCalendar();
}

function clearLogs() {
    if (confirm("Are you sure you want to permanently clear all health logs?")) {
        localStorage.removeItem('healthLogs');
        updateDashboardView();
    }
}

// Initial Boot Screen Render
window.onload = function() {
    updateDashboardView();
    renderAlarmsList();
};
