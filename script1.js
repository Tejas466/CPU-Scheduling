let processCount = 1;

// Store the processes and their times
let processesData = []; // Array to store process data
let totalTurnaroundTime = 0; // Total Turnaround Time
let totalWaitingTime = 0; // Total Waiting Time

document.getElementById("addProcess").addEventListener("click", function () {
    const processContainer = document.getElementById("processContainer");
    const newProcess = document.createElement("div");
    newProcess.classList.add("process");
    newProcess.innerHTML = `
        <label for="arrivalTime${processCount}">Arrival Time (P${processCount + 1}):</label>
        <input type="number" id="arrivalTime${processCount}" name="arrivalTime${processCount}" required>
        <label for="burstTime${processCount}">Burst Time (P${processCount + 1}):</label>
        <input type="number" id="burstTime${processCount}" name="burstTime${processCount}" required>
    `;
    processContainer.appendChild(newProcess);
    processCount++;
});

// Show or hide additional inputs based on the selected algorithm
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
});

// Handle form submission
document.getElementById("schedulingForm").addEventListener("submit", function (event) {
    event.preventDefault();

    // Clear previous results
    clearResultsTable();

    // Gather process data
    processesData = []; // Reset process data
    for (let i = 0; i < processCount; i++) {
        const arrivalTime = parseInt(document.getElementById(`arrivalTime${i}`).value);
        const burstTime = parseInt(document.getElementById(`burstTime${i}`).value);
        const process = { process: `P${i + 1}`, arrivalTime, burstTime };
        
        // Add priority if priority scheduling is selected
        if (document.getElementById("algorithm").value === "priority") {
            process.priority = parseInt(document.getElementById(`priority`).value);
        }
        processesData.push(process);
    }

    const selectedAlgorithm = document.getElementById("algorithm").value;

    if (selectedAlgorithm === "fcfs") {
        fcfs(processesData);
    } else if (selectedAlgorithm === "sjf") {
        sjf(processesData);
    } else if (selectedAlgorithm === "rrs") {
        const timeQuantum = parseInt(document.getElementById("timeQuantum").value);
        rrs(processesData, timeQuantum);
    } else if (selectedAlgorithm === "ljf") {
        ljf(processesData);
    } else if (selectedAlgorithm === "priority") {
        priorityScheduling(processesData);
    } else if (selectedAlgorithm === "lrtf") {
        lrtf(processesData);
    } else if (selectedAlgorithm === "srtf") {
        srtf(processesData);
    }
});

// Clear previous results in the results table
function clearResultsTable() {
    const resultTable = document.getElementById("resultTable").getElementsByTagName("tbody")[0];
    resultTable.innerHTML = ""; // Clear all rows
}

// FCFS Algorithm
function fcfs(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    executeProcesses(processes);
}

// SJF Algorithm
function sjf(processes) {
    processes.sort((a, b) => a.burstTime - b.burstTime);
    executeProcesses(processes);
}

// Round Robin Algorithm
async function rrs(processes, timeQuantum) {
    let queue = [...processes];
    let currentTime = 0;

    const executeNextProcess = async () => {
        while (queue.length > 0) {
            const process = queue.shift();
            const executionTime = Math.min(timeQuantum, process.burstTime);
            process.startTime = Math.max(currentTime, process.arrivalTime);
            process.completionTime = process.startTime + executionTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;

            // Add to totals for average calculation
            totalTurnaroundTime += process.turnaroundTime;
            totalWaitingTime += process.waitingTime;

            // Display the results
            updateResultsTable(process);
            currentTime += executionTime;

            // Execute the process
            await animateLoadingBar(process, executionTime);

            // If there's remaining burst time, requeue the process
            if (process.burstTime > timeQuantum) {
                process.burstTime -= timeQuantum;
                queue.push(process);
            }
        }
        calculateAverages(processes.length); // Calculate averages after execution
    };

    await executeNextProcess();
}

// LJF Algorithm
function ljf(processes) {
    processes.sort((a, b) => b.burstTime - a.burstTime);
    executeProcesses(processes);
}

// Priority Scheduling Algorithm
function priorityScheduling(processes) {
    processes.sort((a, b) => a.priority - b.priority);
    executeProcesses(processes);
}

// LRTF Algorithm
function lrtf(processes) {
    processes.sort((a, b) => b.remainingTime - a.remainingTime);
    executeProcesses(processes);
}

// SRTF Algorithm
function srtf(processes) {
    processes.sort((a, b) => a.remainingTime - b.remainingTime);
    executeProcesses(processes);
}

// Execute the processes and update results table
async function executeProcesses(processes) {
    let currentTime = 0;

    for (const process of processes) {
        process.startTime = Math.max(currentTime, process.arrivalTime);
        process.completionTime = process.startTime + process.burstTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;

        // Add to totals for average calculation
        totalTurnaroundTime += process.turnaroundTime;
        totalWaitingTime += process.waitingTime;

        updateResultsTable(process);
        currentTime = process.completionTime;

        // Animate the loading bar for this process
        await animateLoadingBar(process, process.burstTime);
    }
    calculateAverages(processes.length); // Calculate averages after execution
}

// Update the results table after process completion
function updateResultsTable(process) {
    const resultTable = document.getElementById("resultTable").getElementsByTagName("tbody")[0];
    const row = resultTable.insertRow();
    row.innerHTML = `
        <td>${process.process}</td>
        <td>${process.arrivalTime}</td>
        <td>${process.burstTime}</td>
        <td>${process.startTime}</td>
        <td>${process.completionTime}</td>
        <td>${process.turnaroundTime}</td>
        <td>${process.waitingTime}</td>
        <td>${process.priority || "-"}</td>
        <td>
            <div class="loading-bar">
                <div class="progress" style="width: 0;"></div>
            </div>
        </td>
    `;
}

// Function to animate the loading bar
function animateLoadingBar(process, totalTime) {
    return new Promise((resolve) => {
        const row = document.querySelector(`#resultTable tbody tr:last-child`);
        const progressBar = row.querySelector(".progress");
        let progress = 0;
        const interval = setInterval(() => {
            progress += (100 / totalTime); // Increase progress based on total time
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                resolve();
            }
            progressBar.style.width = progress + "%"; // Update the loading bar width
        }, 1000); // Update every second
    });
}

// Calculate averages and update the display
function calculateAverages(processCount) {
    const avgTurnaroundTime = totalTurnaroundTime / processCount;
    const avgWaitingTime = totalWaitingTime / processCount;

    // Update averages in the UI
    document.getElementById("avgTurnaroundTime").innerText = `Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}`;
    document.getElementById("avgWaitingTime").innerText = `Average Waiting Time: ${avgWaitingTime.toFixed(2)}`;

    // Call function to render the chart
    renderChart(processesData); // Pass processes data to render the chart
}

// Function to render the chart
// Function to render the chart
function renderChart(processes) {
    const ctx = document.getElementById("performanceChart").getContext("2d");

    // Prepare data for the chart
    const labels = processes.map(p => p.process); // Labels for each process
    const turnaroundTimes = processes.map(p => p.turnaroundTime); // Turnaround times for each process
    const waitingTimes = processes.map(p => p.waitingTime); // Waiting times for each process

    // Destroy previous chart instance if it exists
    if (window.performanceChart) {
        window.performanceChart.destroy();
    }

    // Create a new chart
    window.performanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Turnaround Time',
                    data: turnaroundTimes,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Waiting Time',
                    data: waitingTimes,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

