let processCount = 1;
let processesData = [];
let totalTurnaroundTime = 0;
let totalWaitingTime = 0;
let barChart, pieChart;

document.getElementById("addProcess").addEventListener("click", function () {
    const processContainer = document.getElementById("processContainer");
    const newProcess = document.createElement("div");
    newProcess.classList.add("process");

    const selectedAlgorithm = document.getElementById("algorithm").value;
    let priorityInput = '';

    if (selectedAlgorithm === "priority") {
        priorityInput = `
            <label for="priority${processCount}">Priority (P${processCount + 1}):</label>
            <input type="number" id="priority${processCount}" name="priority${processCount}" min="1" required>
        `;
    }

    newProcess.innerHTML = `
        <label for="arrivalTime${processCount}">Arrival Time (P${processCount + 1}):</label>
        <input type="number" id="arrivalTime${processCount}" name="arrivalTime${processCount}" min="0" required>
        <label for="burstTime${processCount}">Burst Time (P${processCount + 1}):</label>
        <input type="number" id="burstTime${processCount}" name="burstTime${processCount}" min="0" required>
        ${priorityInput}
    `;
    processContainer.appendChild(newProcess);
    processCount++;
});


document.getElementById("algorithm").addEventListener("change", function () {
    const selectedAlgorithm = this.value;
    const extraInputs = document.getElementById("extraInputs");
    const quantumInput = document.getElementById("quantumInput");
    const priorityInput = document.getElementById("priorityInput");

    if (selectedAlgorithm === "rrs") {
        extraInputs.style.display = "block";
        quantumInput.style.display = "block";
        priorityInput.style.display = "none";
    } else if (selectedAlgorithm === "priority") {
        extraInputs.style.display = "block";
        quantumInput.style.display = "none";
        priorityInput.style.display = "block";
    } else {
        extraInputs.style.display = "none";
    }

    const processFields = document.querySelectorAll(".process");
    processFields.forEach((processField, index) => {
        if (selectedAlgorithm === "priority") {
            if (!processField.querySelector(`#priority${index}`)) {
                const priorityInput = document.createElement('div');
                priorityInput.innerHTML = `
                    <label for="priority${index}">Priority (P${index + 1}):</label>
                    <input type="number" id="priority${index}" name="priority${index}" min="1" required>
                `;
                processField.appendChild(priorityInput);
            }
        } else {
            const priorityField = processField.querySelector(`#priority${index}`);
            if (priorityField) {
                priorityField.remove();
            }
        }
    });
});


document.getElementById("schedulingForm").addEventListener("submit", function (event) {
    event.preventDefault();

    clearResultsTable();
    processesData = [];
    totalTurnaroundTime = 0;
    totalWaitingTime = 0;
    let valid = true;

    for (let i = 0; i < processCount; i++) {
        const arrivalTime = parseInt(document.getElementById(`arrivalTime${i}`).value);
        const burstTime = parseInt(document.getElementById(`burstTime${i}`).value);

        if (arrivalTime < 0 || burstTime < 0) {
            alert(`Arrival Time and Burst Time should not be less than 0 for Process P${i + 1}.`);
            valid = false;
            break;
        }

        const process = { process: `P${i + 1}`, arrivalTime, burstTime };

        if (document.getElementById("algorithm").value === "priority") {
            const priority = parseInt(document.getElementById(`priority${i}`).value);
            process.priority = priority;
        }

        processesData.push(process);
    }

    if (!valid) return;

    const selectedAlgorithm = document.getElementById("algorithm").value;

    switch (selectedAlgorithm) {
        case "fcfs":
            fcfs(processesData);
            break;
        case "sjf":
            sjf(processesData);
            break;
        case "rrs":
            const timeQuantum = parseInt(document.getElementById("timeQuantum").value);
            rrs(processesData, timeQuantum);
            break;
        case "ljf":
            ljf(processesData);
            break;
        case "priority":
            priorityScheduling(processesData);
            break;
        case "lrtf":
            lrtf(processesData);
            break;
        case "srtf":
            srtf(processesData);
            break;
        default:
            break;
    }
});


function clearResultsTable() {
    const resultTable = document.getElementById("resultTable").getElementsByTagName("tbody")[0];
    resultTable.innerHTML = "";
}

let ganttChartData = [];

function executeProcesses(processes, executionSegments) {
    let currentTime = 0;
    executionSegments.length = 0;

    processes.forEach(process => {
        process.startTime = Math.max(currentTime, process.arrivalTime);
        process.completionTime = process.startTime + process.burstTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;

        executionSegments.push({
            process: process.process,
            startTime: process.startTime,
            endTime: process.completionTime
        });

        totalTurnaroundTime += process.turnaroundTime;
        totalWaitingTime += process.waitingTime;

        updateResultsTable(process);
        currentTime = process.completionTime;
    });

    calculateAverages(processes.length);
    renderChart(processes);
    renderPieChart(processes);
    renderGanttChart(executionSegments);
}


function updateResultsTable(process) {
    const resultTable = document.getElementById("resultTable").getElementsByTagName("tbody")[0];
    const row = resultTable.insertRow();
    row.innerHTML = `
        <td>${process.process}</td>
        <td>${process.arrivalTime}</td>
        <td>${process.burstTime}</td>
        <td>${process.completionTime}</td>
        <td>${process.turnaroundTime}</td>
        <td>${process.waitingTime}</td>
        <td>${process.priority !== undefined ? process.priority : 'N/A'}</td>
    `;
}


function calculateAverages(processCount) {
    const avgTurnaroundTime = totalTurnaroundTime / processCount;
    const avgWaitingTime = totalWaitingTime / processCount;

    document.getElementById("avgTurnaroundTime").innerText = `Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}`;
    document.getElementById("avgWaitingTime").innerText = `Average Waiting Time: ${avgWaitingTime.toFixed(2)}`;
}


function renderChart(processes) {
    const ctx = document.getElementById("performanceChart").getContext("2d");

    const labels = processes.map(p => p.process);
    const turnaroundTimes = processes.map(p => p.turnaroundTime);
    const waitingTimes = processes.map(p => p.waitingTime);

    if (barChart) {
        barChart.destroy();
    }

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Turnaround Time',
                    data: turnaroundTimes,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Waiting Time',
                    data: waitingTimes,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                }
            },
            barPercentage: 0.4,
            categoryPercentage: 0.6,
        }
    });

    document.getElementById("performanceChart").style.height = "200px";
}

function renderPieChart(processes) {
    const ctx = document.getElementById("pieChart").getContext("2d");

    const labels = processes.map(p => p.process);
    const burstTimes = processes.map(p => p.burstTime);

    if (pieChart) {
        pieChart.destroy();
    }

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Burst Time',
                data: burstTimes,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 5,
                    bottom: 5,
                }
            }
        }
    });


    document.getElementById("pieChart").style.width = "300px";
    document.getElementById("pieChart").style.height = "300px";
}

function fcfs(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    executeProcesses(processes, ganttChartData); 
}

function sjf(processes) {
    let completedProcesses = [];
    let currentTime = 0;
    let remainingProcesses = [...processes];

    while (remainingProcesses.length > 0) {

        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

        if (availableProcesses.length > 0) {

            availableProcesses.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);

            const currentProcess = availableProcesses[0];

            currentProcess.startTime = currentTime;
            currentProcess.completionTime = currentProcess.startTime + currentProcess.burstTime;
            currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
            currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

            totalTurnaroundTime += currentProcess.turnaroundTime;
            totalWaitingTime += currentProcess.waitingTime;

            ganttChartData.push({
                process: currentProcess.process,
                startTime: currentProcess.startTime,
                endTime: currentProcess.completionTime
            });

            completedProcesses.push(currentProcess);

            remainingProcesses = remainingProcesses.filter(p => p !== currentProcess);

            currentTime = currentProcess.completionTime;
        } else {
            currentTime++;
        }
    }

    completedProcesses.forEach(process => updateResultsTable(process));

    calculateAverages(processes.length);
    renderChart(processes);
    renderPieChart(processes);
    renderGanttChart(ganttChartData);
}


function rrs(processes, timeQuantum) {
    let queue = [...processes];
    let currentTime = 0;
    let executionSegments = [];

    queue.forEach(process => {
        process.remainingTime = process.burstTime;
    });

    while (queue.length > 0) {
        const currentProcess = queue.shift();

        if (currentProcess.arrivalTime <= currentTime) {
            const executionTime = Math.min(currentProcess.remainingTime, timeQuantum);
            currentProcess.startTime = currentTime;
            currentTime += executionTime;
            currentProcess.remainingTime -= executionTime;

            executionSegments.push({
                process: currentProcess.process,
                startTime: currentProcess.startTime,
                endTime: currentTime
            });

            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

                totalTurnaroundTime += currentProcess.turnaroundTime;
                totalWaitingTime += currentProcess.waitingTime;

                updateResultsTable(currentProcess);
            } else {
                queue.push(currentProcess);
            }
        } else {
            currentTime++;
            queue.push(currentProcess);
        }
    }

    ganttChartData = executionSegments;

    calculateAverages(processes.length);
    renderChart(processes);
    renderPieChart(processes);
    renderGanttChart(ganttChartData);
}


function renderGanttChart(executionSegments) {
    const ganttChartContainer = document.getElementById("ganttChart");
    ganttChartContainer.innerHTML = "";

    const maxTime = Math.max(...executionSegments.map(seg => seg.endTime));
    const chartWidth = maxTime * 20;
    ganttChartContainer.style.width = `${chartWidth}px`;
    ganttChartContainer.style.position = "relative";
    ganttChartContainer.style.margin = "0";

    executionSegments.forEach(seg => {
        const processBlock = document.createElement("div");
        processBlock.style.position = "absolute";
        processBlock.style.left = `${seg.startTime * 20}px`;
        processBlock.style.width = `${(seg.endTime - seg.startTime) * 20 - 4}px`;
        processBlock.style.height = "30px"; 
        processBlock.style.border = "1px solid blue"; 
        processBlock.style.backgroundColor = "rgba(75, 192, 192, 1)"; 
        processBlock.style.lineHeight = "30px";
        processBlock.style.textAlign = "center";
        processBlock.style.fontWeight = "bold";
        processBlock.innerText = seg.process;

        ganttChartContainer.appendChild(processBlock);
        
        const timeLabel = document.createElement("div");
        timeLabel.style.position = "absolute";
        timeLabel.style.left = `${seg.startTime * 20}px`;
        timeLabel.style.width = `${(seg.endTime - seg.startTime) * 20 - 4}px`;
        timeLabel.style.textAlign = "center";
        timeLabel.style.marginTop = "35px";
        timeLabel.style.fontWeight = "bold";
        timeLabel.innerText = `${seg.startTime}-${seg.endTime}`;

        ganttChartContainer.appendChild(timeLabel);
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function priorityScheduling(processes) {
    processes.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime);
    executeProcesses(processes, ganttChartData);
}


function ljf(processes) {
    let completedProcesses = [];
    let currentTime = 0;
    let remainingProcesses = [...processes];

    while (remainingProcesses.length > 0) {
   
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

        if (availableProcesses.length === 0) {
            currentTime++;
            continue;
        }

        availableProcesses.sort((a, b) => b.burstTime - a.burstTime);

        const currentProcess = availableProcesses[0];

        currentProcess.startTime = currentTime;
        currentProcess.completionTime = currentProcess.startTime + currentProcess.burstTime;
        currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

        totalTurnaroundTime += currentProcess.turnaroundTime;
        totalWaitingTime += currentProcess.waitingTime;

        ganttChartData.push({
            process: currentProcess.process,
            startTime: currentProcess.startTime,
            endTime: currentProcess.completionTime,
        });

        completedProcesses.push(currentProcess);

        remainingProcesses = remainingProcesses.filter(p => p !== currentProcess);

        currentTime = currentProcess.completionTime;
    }

    completedProcesses.forEach(process => updateResultsTable(process));
    calculateAverages(processes.length);
    renderChart(processes);
    renderPieChart(processes);
    renderGanttChart(ganttChartData);
}
