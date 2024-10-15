let processCount = 1;
let processesData = [];
let totalTurnaroundTime = 0;
let totalWaitingTime = 0;
let barChart, pieChart;

document.getElementById("addProcess").addEventListener("click", function () {
    const processContainer = document.getElementById("processContainer");
    const newProcess = document.createElement("div");
    newProcess.classList.add("process");

    newProcess.innerHTML = `
        <label for="arrivalTime${processCount}">Arrival Time (P${processCount + 1}):</label>
        <input type="number" id="arrivalTime${processCount}" name="arrivalTime${processCount}" min="0" required>
        <label for="burstTime${processCount}">Burst Time (P${processCount + 1}):</label>
        <input type="number" id="burstTime${processCount}" name="burstTime${processCount}" min="0" required>
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
            process.priority = parseInt(document.getElementById(`priority`).value);
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

// Clear the results table
function clearResultsTable() {
    const resultTable = document.getElementById("resultTable").getElementsByTagName("tbody")[0];
    resultTable.innerHTML = "";
}

let ganttChartData = []; // Array to store Gantt chart data

// Execute processes and update results
function executeProcesses(processes, executionSegments) {
    let currentTime = 0;
    executionSegments.length = 0; // Clear previous execution segments

    processes.forEach(process => {
        process.startTime = Math.max(currentTime, process.arrivalTime);
        process.completionTime = process.startTime + process.burstTime;
        process.turnaroundTime = process.completionTime - process.arrivalTime;
        process.waitingTime = process.turnaroundTime - process.burstTime;

        // Store data for Gantt Chart
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
    renderGanttChart(executionSegments); // Call to render Gantt chart after processes execution
}

// Update results table
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

// Calculate averages
function calculateAverages(processCount) {
    const avgTurnaroundTime = totalTurnaroundTime / processCount;
    const avgWaitingTime = totalWaitingTime / processCount;

    document.getElementById("avgTurnaroundTime").innerText = `Average Turnaround Time: ${avgTurnaroundTime.toFixed(2)}`;
    document.getElementById("avgWaitingTime").innerText = `Average Waiting Time: ${avgWaitingTime.toFixed(2)}`;
}

// Render bar chart with reduced height and narrower bars
function renderChart(processes) {
    const ctx = document.getElementById("performanceChart").getContext("2d");

    const labels = processes.map(p => p.process);
    const turnaroundTimes = processes.map(p => p.turnaroundTime);
    const waitingTimes = processes.map(p => p.waitingTime);

    if (barChart) {
        barChart.destroy(); // Destroy previous chart instance to update it dynamically
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
            maintainAspectRatio: false, // Allows us to set a fixed height
            layout: {
                padding: {
                    top: 10,
                    bottom: 10,
                }
            },
            barPercentage: 0.4,  // Reduces the width of the bars
            categoryPercentage: 0.6, // Adjusts the space between categories (bars)
        }
    });

    // Reduce the size of the canvas to lower the bar chart height
    document.getElementById("performanceChart").style.height = "200px"; // Adjust the height as needed
}

// Render pie chart with reduced size
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

    // Reduce the size of the canvas to make the pie chart smaller
    document.getElementById("pieChart").style.width = "300px";
    document.getElementById("pieChart").style.height = "300px";
}

function fcfs(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    executeProcesses(processes, ganttChartData); // Pass ganttChartData to track execution
}

function sjf(processes) {
    let completedProcesses = []; // To store completed processes
    let currentTime = 0;
    let remainingProcesses = [...processes]; // Copy of the processes

    while (remainingProcesses.length > 0) {
        // Filter processes that have arrived
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

        if (availableProcesses.length > 0) {
            // Sort available processes by burst time (and arrival time for tie-breaking)
            availableProcesses.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime);

            // Select the process with the shortest burst time
            const currentProcess = availableProcesses[0];

            // Execute the selected process
            currentProcess.startTime = currentTime;
            currentProcess.completionTime = currentProcess.startTime + currentProcess.burstTime;
            currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
            currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

            // Update total times
            totalTurnaroundTime += currentProcess.turnaroundTime;
            totalWaitingTime += currentProcess.waitingTime;

            // Store execution segment for Gantt chart
            ganttChartData.push({
                process: currentProcess.process,
                startTime: currentProcess.startTime,
                endTime: currentProcess.completionTime
            });

            // Add completed process to the completed array
            completedProcesses.push(currentProcess);

            // Remove the completed process from remaining processes
            remainingProcesses = remainingProcesses.filter(p => p !== currentProcess);

            // Update current time
            currentTime = currentProcess.completionTime;
        } else {
            // If no processes are available, advance time
            currentTime++;
        }
    }

    // Update results table for completed processes
    completedProcesses.forEach(process => updateResultsTable(process));

    // Calculate averages and render charts after processing
    calculateAverages(processes.length);
    renderChart(processes);
    renderPieChart(processes);
    renderGanttChart(ganttChartData); // Pass execution segments to render Gantt chart
}


function rrs(processes, timeQuantum) {
    let queue = [...processes];
    let currentTime = 0;
    let executionSegments = []; // Store execution segments for Gantt chart

    // Initialize remaining time for each process
    queue.forEach(process => {
        process.remainingTime = process.burstTime; // Add this line
    });

    while (queue.length > 0) {
        const currentProcess = queue.shift();

        // If the process has arrived, execute it
        if (currentProcess.arrivalTime <= currentTime) {
            const executionTime = Math.min(currentProcess.remainingTime, timeQuantum);
            currentProcess.startTime = currentTime;
            currentTime += executionTime;
            currentProcess.remainingTime -= executionTime;

            // Record the execution segment for Gantt chart
            executionSegments.push({
                process: currentProcess.process,
                startTime: currentProcess.startTime,
                endTime: currentTime
            });

            // If the process has finished executing
            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

                totalTurnaroundTime += currentProcess.turnaroundTime; // Accumulate totals
                totalWaitingTime += currentProcess.waitingTime;

                updateResultsTable(currentProcess); // Add results to table
            } else {
                queue.push(currentProcess); // Re-add the process if it's not finished
            }
        } else {
            currentTime++; // Increment time if no process is ready
            queue.push(currentProcess); // Re-add the current process if it hasn't arrived yet
        }
    }

    // Store the execution segments for Gantt chart rendering
    ganttChartData = executionSegments; // Use executionSegments for rendering Gantt chart

    // Calculate averages and render charts after processing
    calculateAverages(processes.length);
    renderChart(processes);
    renderPieChart(processes);
    renderGanttChart(ganttChartData); // Pass execution segments to render Gantt chart
}


// Render Gantt Chart
function renderGanttChart(executionSegments) {
    const ganttChartContainer = document.getElementById("ganttChart");
    ganttChartContainer.innerHTML = ""; // Clear previous chart

    // Calculate the maximum time for chart width
    const maxTime = Math.max(...executionSegments.map(seg => seg.endTime));
    const chartWidth = maxTime * 20; // Width for each time unit
    ganttChartContainer.style.width = `${chartWidth}px`;
    ganttChartContainer.style.position = "relative"; // Set position relative for absolute positioning of blocks
    ganttChartContainer.style.margin = "0"; // Align to the left by removing auto margins

    // Create and display Gantt chart blocks
    executionSegments.forEach(seg => {
        const processBlock = document.createElement("div");
        processBlock.style.position = "absolute";
        processBlock.style.left = `${seg.startTime * 20}px`; // Adjust based on time unit width
        processBlock.style.width = `${(seg.endTime - seg.startTime) * 20 - 4}px`; // Width with separation
        processBlock.style.height = "30px"; // Height of the block
        processBlock.style.border = "1px solid blue"; // Border for visibility
        processBlock.style.backgroundColor = "rgba(75, 192, 192, 1)"; // Make background opaque
        processBlock.style.lineHeight = "30px"; // Center text vertically
        processBlock.style.textAlign = "center"; // Center text horizontally
        processBlock.style.fontWeight = "bold"; // Bold text for visibility
        processBlock.innerText = seg.process; // Process name

        ganttChartContainer.appendChild(processBlock);
        
        // Create the time label below the process block
        const timeLabel = document.createElement("div");
        timeLabel.style.position = "absolute";
        timeLabel.style.left = `${seg.startTime * 20}px`; // Match the process block's left position
        timeLabel.style.width = `${(seg.endTime - seg.startTime) * 20 - 4}px`; // Match the width of the block
        timeLabel.style.textAlign = "center"; // Center text horizontally
        timeLabel.style.marginTop = "35px"; // Space between block and label
        timeLabel.style.fontWeight = "bold"; // Bold text for visibility
        timeLabel.innerText = `${seg.startTime}-${seg.endTime}`; // Time range format

        ganttChartContainer.appendChild(timeLabel);
    });
}

// Function to get a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function priorityScheduling(processes) {
    processes.sort((a, b) => a.priority - b.priority);
    executeProcesses(processes, ganttChartData); // Pass ganttChartData
}

function ljf(processes) {
    processes.sort((a, b) => b.burstTime - a.burstTime);
    executeProcesses(processes, ganttChartData); // Pass ganttChartData
}

// function lrtf(processes) {
//     processes.sort((a, b) => b.remainingBurstTime - a.remainingBurstTime);
//     executeProcesses(processes, ganttChartData); // Pass ganttChartData
// }

// function srtf(processes) {
//     let completedProcesses = []; // Array to store completed processes
//     let currentTime = 0; // Track current time
//     let remainingProcesses = [...processes]; // Copy of the processes

//     // Initialize remaining times
//     remainingProcesses.forEach(process => {
//         process.remainingTime = process.burstTime; // Add remaining time for each process
//     });

//     while (remainingProcesses.length > 0) {
//         // Filter processes that have arrived
//         let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= currentTime);

//         if (availableProcesses.length > 0) {
//             // Sort available processes by remaining time (and arrival time for tie-breaking)
//             availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);

//             // Select the process with the shortest remaining time
//             const currentProcess = availableProcesses[0];

//             // Execute the selected process for 1 time unit
//             currentProcess.remainingTime -= 1; // Decrease remaining time by 1
//             currentTime++; // Increment current time

//             // Record the execution segment for Gantt chart
//             ganttChartData.push({
//                 process: currentProcess.process,
//                 startTime: currentTime - 1, // Current time before increment
//                 endTime: currentTime // Current time after increment
//             });

//             // If the process has finished executing
//             if (currentProcess.remainingTime === 0) {
//                 currentProcess.completionTime = currentTime;
//                 currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
//                 currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;

//                 // Update totals
//                 totalTurnaroundTime += currentProcess.turnaroundTime;
//                 totalWaitingTime += currentProcess.waitingTime;

//                 // Update results table
//                 completedProcesses.push(currentProcess);
//                 remainingProcesses = remainingProcesses.filter(p => p !== currentProcess); // Remove completed process
//             }
//         } else {
//             // If no processes are available, increment time
//             currentTime++;
//         }
//     }

//     // Update results table for completed processes
//     completedProcesses.forEach(process => updateResultsTable(process));

//     // Calculate averages and render charts after processing
//     calculateAverages(processes.length);
//     renderChart(processes);
//     renderPieChart(processes);
//     renderGanttChart(ganttChartData); // Pass execution segments to render Gantt chart
// }


