// Calculate BMI score and present status text
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weight').value);
    const heightCm = parseFloat(document.getElementById('height').value);
    
    if (!weight || !heightCm) {
        alert("Please enter both weight and height.");
        return;
    }

    const heightM = heightCm / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);
    
    document.getElementById('bmiValue').innerText = bmi;
    
    let status = "";
    let colorClass = "";
    
    if (bmi < 18.5) {
        status = "Underweight";
        colorClass = "text-yellow-600";
    } else if (bmi >= 18.5 && bmi < 24.9) {
        status = "Normal Weight";
        colorClass = "text-green-600";
    } else if (bmi >= 25 && bmi < 29.9) {
        status = "Overweight";
        colorClass = "text-orange-600";
    } else {
        status = "Obesity";
        colorClass = "text-red-600";
    }
    
    const statusEl = document.getElementById('bmiStatus');
    statusEl.innerText = status;
    statusEl.className = `text-xs font-semibold mt-1 ${colorClass}`;
    document.getElementById('bmiResult').classList.remove('hidden');

    return bmi;
}

// Log Vitals into local storage array
function logVitals() {
    const bp = document.getElementById('bp').value || "—";
    const sugar = document.getElementById('sugar').value || "—";
    const pulse = document.getElementById('pulse').value || "—";
    const currentBmi = document.getElementById('bmiValue').innerText !== "0.0" ? document.getElementById('bmiValue').innerText : "—";

    const logEntry = {
        timestamp: new Date().toLocaleString(),
        bmi: currentBmi,
        bp: bp,
        sugar: sugar ? `${sugar} mg/dL` : "—",
        pulse: pulse ? `${pulse} BPM` : "—"
    };

    let existingLogs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    existingLogs.unshift(logEntry); // Put newest data at top
    localStorage.setItem('healthLogs', JSON.stringify(existingLogs));

    // Clear entry fields
    document.getElementById('bp').value = '';
    document.getElementById('sugar').value = '';
    document.getElementById('pulse').value = '';

    renderTable();
}

// Render data logs into the HTML table
function renderTable() {
    const logs = JSON.parse(localStorage.getItem('healthLogs')) || [];
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';

    if(logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400 italic">No health records saved yet. Your daily log entries will display here.</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 transition border-b";
        row.innerHTML = `
            <td class="p-3 text-xs text-gray-400 font-mono">${log.timestamp}</td>
            <td class="p-3 font-semibold text-blue-600">${log.bmi}</td>
            <td class="p-3 text-gray-700">${log.bp}</td>
            <td class="p-3 text-gray-700">${log.sugar}</td>
            <td class="p-3 text-gray-700">${log.pulse}</td>
        `;
        tbody.appendChild(row);
    });
}

// Wipe local history data cleanly
function clearLogs() {
    if(confirm("Are you sure you want to permanently clear all logs stored in your local browser?")) {
        localStorage.removeItem('healthLogs');
        renderTable();
    }
}

// Render historical tables on first-page bootup
window.onload = renderTable;
