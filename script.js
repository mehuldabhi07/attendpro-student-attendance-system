// --- Initial Sample Data ---
let students = JSON.parse(localStorage.getItem('attendpro_students')) || [
    { id: 1, name: "Aarav Sharma", class: "5", section: "A", roll_no: "101", parent_name: "Mr. Sharma", parent_phone: "+91 9876543210" },
    { id: 2, name: "Priya Patel", class: "5", section: "A", roll_no: "102", parent_name: "Mrs. Patel", parent_phone: "+91 9876543211" },
    { id: 3, name: "Rahul Verma", class: "5", section: "B", roll_no: "103", parent_name: "Mr. Verma", parent_phone: "+91 9876543212" },
    { id: 4, name: "Ananya Gupta", class: "6", section: "A", roll_no: "104", parent_name: "Mrs. Gupta", parent_phone: "+91 9876543213" }
];

let classes = [
    { id: "5-A", name: "Class 5", section: "A", teacher: "Ms. Sunita" },
    { id: "5-B", name: "Class 5", section: "B", teacher: "Mr. Rajesh" },
    { id: "6-A", name: "Class 6", section: "A", teacher: "Mrs. Kapoor" }
];

let attendanceRecords = JSON.parse(localStorage.getItem('attendpro_attendance')) || [
    { id: 1, student_id: 1, date: getTodayDate(), status: "Present", remarks: "" },
    { id: 2, student_id: 2, date: getTodayDate(), status: "Absent", remarks: "Fever" },
    { id: 3, student_id: 3, date: getTodayDate(), status: "Late", remarks: "Traffic delay" },
    { id: 4, student_id: 4, date: getTodayDate(), status: "Present", remarks: "" }
];

let leaveRequests = JSON.parse(localStorage.getItem('attendpro_leaves')) || [
    { id: 1, student_id: 2, from_date: getTodayDate(), to_date: getTodayDate(), reason: "Sick leave", status: "Approved" }
];

// Charts references
let todayChart, trendChart, pieChart;

// --- DOM Loaded Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDarkMode();
    initDates();
    renderDashboard();
    renderStudentTable();
    renderClasses();
    renderAttendanceMarkingTable();
    renderReportsTable();
    renderHistoryOptions();
    renderLeaveTable();
    initModalEvents();
});

// Helper Functions
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function saveData() {
    localStorage.setItem('attendpro_students', JSON.stringify(students));
    localStorage.setItem('attendpro_attendance', JSON.stringify(attendanceRecords));
    localStorage.setItem('attendpro_leaves', JSON.stringify(leaveRequests));
}

// --- Navigation Logic ---
function initNavigation() {
    const links = document.querySelectorAll('.sidebar .nav-links li a');
    const sections = document.querySelectorAll('.content-section');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').replace('#', '');
            
            links.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');

            sections.forEach(sec => {
                if (sec.id === targetId) sec.classList.add('active');
                else sec.classList.remove('active');
            });

            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }

            // Refresh views if switching sections
            if(targetId === 'dashboard') renderDashboard();
            if(targetId === 'analytics') renderAnalyticsCharts();
        });
    });

    toggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// --- Dark Mode ---
function initDarkMode() {
    const toggleBtn = document.getElementById('darkModeToggle');
    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });
}

function initDates() {
    document.getElementById('attendanceDatePicker').value = getTodayDate();
    document.getElementById('reportDatePicker').value = getTodayDate();
}

// --- Dashboard Component ---
function renderDashboard() {
    const total = students.length;
    const today = getTodayDate();
    const todayLogs = attendanceRecords.filter(a => a.date === today);

    const present = todayLogs.filter(a => a.status === 'Present').length;
    const absent = todayLogs.filter(a => a.status === 'Absent').length;
    const leaveLate = todayLogs.filter(a => a.status === 'Late' || a.status === 'Leave').length;

    document.getElementById('statTotalStudents').innerText = total;
    document.getElementById('statPresentToday').innerText = present;
    document.getElementById('statAbsentToday').innerText = absent;
    document.getElementById('statLeaveToday').innerText = leaveLate;

    renderTodayChart(present, absent, leaveLate);
}

function renderTodayChart(p, a, l) {
    const ctx = document.getElementById('todayAttendanceChart').getContext('2d');
    if (todayChart) todayChart.destroy();

    todayChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Late/Leave'],
            datasets: [{
                data: [p, a, l],
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// --- Student CRUD ---
function renderStudentTable() {
    const tbody = document.getElementById('studentTableBody');
    const searchVal = document.getElementById('studentSearchInput').value.toLowerCase();
    const classVal = document.getElementById('studentClassFilter').value;

    tbody.innerHTML = '';

    const filtered = students.filter(s => {
        const classKey = `${s.class}-${s.section}`;
        const matchSearch = s.name.toLowerCase().includes(searchVal) || s.roll_no.includes(searchVal);
        const matchClass = classVal === 'All' || classKey === classVal;
        return matchSearch && matchClass;
    });

    filtered.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.roll_no}</td>
            <td>${s.name}</td>
            <td>Class ${s.class}-${s.section}</td>
            <td>${s.parent_name}</td>
            <td>${s.parent_phone}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editStudent(${s.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteStudent(${s.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('studentSearchInput').addEventListener('input', renderStudentTable);
document.getElementById('studentClassFilter').addEventListener('change', renderStudentTable);

function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== id);
        saveData();
        renderStudentTable();
        showToast('Student removed');
    }
}

// --- Class Management ---
function renderClasses() {
    const grid = document.getElementById('classListGrid');
    grid.innerHTML = '';

    classes.forEach(c => {
        const count = students.filter(s => `${s.class}-${s.section}` === c.id).length;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3>${c.name} - Section ${c.section}</h3>
            <p><strong>Teacher:</strong> ${c.teacher}</p>
            <p><strong>Total Students:</strong> ${count}</p>
        `;
        grid.appendChild(card);
    });
}

// --- Attendance Marking ---
function renderAttendanceMarkingTable() {
    const classId = document.getElementById('attendanceClassSelect').value;
    const date = document.getElementById('attendanceDatePicker').value;
    const tbody = document.getElementById('attendanceTableBody');

    tbody.innerHTML = '';

    const classStudents = students.filter(s => `${s.class}-${s.section}` === classId);

    classStudents.forEach(s => {
        const record = attendanceRecords.find(a => a.student_id === s.id && a.date === date) || { status: 'Present', remarks: '' };

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.roll_no}</td>
            <td>${s.name}</td>
            <td>
                <div class="status-radio-group">
                    <label><input type="radio" name="status_${s.id}" value="Present" ${record.status === 'Present' ? 'checked' : ''}> Present</label>
                    <label><input type="radio" name="status_${s.id}" value="Absent" ${record.status === 'Absent' ? 'checked' : ''}> Absent</label>
                    <label><input type="radio" name="status_${s.id}" value="Late" ${record.status === 'Late' ? 'checked' : ''}> Late</label>
                    <label><input type="radio" name="status_${s.id}" value="Leave" ${record.status === 'Leave' ? 'checked' : ''}> Leave</label>
                </div>
            </td>
            <td>
                <input type="text" id="remark_${s.id}" class="form-input" value="${record.remarks}" placeholder="Optional remark">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('attendanceClassSelect').addEventListener('change', renderAttendanceMarkingTable);
document.getElementById('attendanceDatePicker').addEventListener('change', renderAttendanceMarkingTable);

document.getElementById('markAllPresentBtn').addEventListener('click', () => {
    const classId = document.getElementById('attendanceClassSelect').value;
    const classStudents = students.filter(s => `${s.class}-${s.section}` === classId);
    classStudents.forEach(s => {
        const radio = document.querySelector(`input[name="status_${s.id}"][value="Present"]`);
        if (radio) radio.checked = true;
    });
    showToast('Marked all as Present');
});

document.getElementById('saveAttendanceBtn').addEventListener('click', () => {
    const classId = document.getElementById('attendanceClassSelect').value;
    const date = document.getElementById('attendanceDatePicker').value;
    const classStudents = students.filter(s => `${s.class}-${s.section}` === classId);

    classStudents.forEach(s => {
        const selectedStatus = document.querySelector(`input[name="status_${s.id}"]:checked`).value;
        const remark = document.getElementById(`remark_${s.id}`).value;

        const existingIdx = attendanceRecords.findIndex(a => a.student_id === s.id && a.date === date);
        if (existingIdx >= 0) {
            attendanceRecords[existingIdx].status = selectedStatus;
            attendanceRecords[existingIdx].remarks = remark;
        } else {
            attendanceRecords.push({
                id: Date.now() + Math.random(),
                student_id: s.id,
                date: date,
                status: selectedStatus,
                remarks: remark
            });
        }
    });

    saveData();
    showToast('Attendance updated!');
});

// --- Reports Section ---
function renderReportsTable() {
    const classFilter = document.getElementById('reportClassFilter').value;
    const dateFilter = document.getElementById('reportDatePicker').value;
    const tbody = document.getElementById('reportTableBody');

    tbody.innerHTML = '';

    attendanceRecords.forEach(a => {
        const student = students.find(s => s.id === a.student_id);
        if (!student) return;

        const classKey = `${student.class}-${student.section}`;
        const matchClass = classFilter === 'All' || classKey === classFilter;
        const matchDate = !dateFilter || a.date === dateFilter;

        if (matchClass && matchDate) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${a.date}</td>
                <td>${student.name}</td>
                <td>Class ${classKey}</td>
                <td><span class="badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
                <td>${a.remarks || '-'}</td>
            `;
            tbody.appendChild(tr);
        }
    });
}

document.getElementById('reportClassFilter').addEventListener('change', renderReportsTable);
document.getElementById('reportDatePicker').addEventListener('change', renderReportsTable);

document.getElementById('exportCsvBtn').addEventListener('click', () => {
    let csv = 'Date,Student Name,Class,Status,Remarks\n';
    attendanceRecords.forEach(a => {
        const student = students.find(s => s.id === a.student_id);
        if(student) {
            csv += `${a.date},"${student.name}","${student.class}-${student.section}",${a.status},"${a.remarks}"\n`;
        }
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${getTodayDate()}.csv`;
    a.click();
});

// --- Student History Section ---
function renderHistoryOptions() {
    const select = document.getElementById('historyStudentSelect');
    select.innerHTML = '';
    students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.innerText = `${s.name} (Class ${s.class}-${s.section})`;
        select.appendChild(opt);
    });

    select.addEventListener('change', loadStudentHistory);
    loadStudentHistory();
}

function loadStudentHistory() {
    const studentId = parseInt(document.getElementById('historyStudentSelect').value);
    const container = document.getElementById('studentHistoryDetails');
    const student = students.find(s => s.id === studentId);

    if (!student) return;

    const history = attendanceRecords.filter(a => a.student_id === studentId);
    const total = history.length;
    const presentCount = history.filter(a => a.status === 'Present').length;
    const pct = total ? Math.round((presentCount / total) * 100) : 0;

    let historyRows = history.map(h => `
        <tr>
            <td>${h.date}</td>
            <td><span class="badge badge-${h.status.toLowerCase()}">${h.status}</span></td>
            <td>${h.remarks || '-'}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <h3>History for ${student.name}</h3>
        <p><strong>Overall Attendance Score:</strong> ${pct}%</p>
        <div class="table-responsive" style="margin-top:15px;">
            <table class="data-table">
                <thead><tr><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
                <tbody>${historyRows || '<tr><td colspan="3">No history available</td></tr>'}</tbody>
            </table>
        </div>
    `;
}

// --- Analytics Charts ---
function renderAnalyticsCharts() {
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    const ctxPie = document.getElementById('analyticsPieChart').getContext('2d');

    if(trendChart) trendChart.destroy();
    if(pieChart) pieChart.destroy();

    trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Attendance Rate (%)',
                data: [95, 90, 88, 92, 96],
                borderColor: '#10B981',
                tension: 0.3
            }]
        }
    });

    const p = attendanceRecords.filter(a => a.status==='Present').length;
    const a = attendanceRecords.filter(a => a.status==='Absent').length;
    const l = attendanceRecords.filter(a => a.status==='Late' || a.status==='Leave').length;

    pieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ['Present', 'Absent', 'Late/Leave'],
            datasets: [{
                data: [p, a, l],
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B']
            }]
        }
    });
}

// --- Leave Management ---
function renderLeaveTable() {
    const tbody = document.getElementById('leaveTableBody');
    tbody.innerHTML = '';

    leaveRequests.forEach(l => {
        const student = students.find(s => s.id === l.student_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${student ? student.name : 'Unknown'}</td>
            <td>${l.from_date}</td>
            <td>${l.to_date}</td>
            <td>${l.reason}</td>
            <td><span class="badge badge-leave">${l.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="updateLeaveStatus(${l.id}, 'Approved')">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="updateLeaveStatus(${l.id}, 'Rejected')">Reject</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateLeaveStatus(id, status) {
    const req = leaveRequests.find(l => l.id === id);
    if(req) {
        req.status = status;
        saveData();
        renderLeaveTable();
        showToast(`Leave status updated to ${status}`);
    }
}

// --- Modals logic ---
function initModalEvents() {
    const studentModal = document.getElementById('studentModal');
    const leaveModal = document.getElementById('leaveModal');

    document.getElementById('openAddStudentModal').addEventListener('click', () => {
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
        document.getElementById('studentModalTitle').innerText = 'Add Student';
        studentModal.classList.add('active');
    });

    document.getElementById('closeStudentModal').addEventListener('click', () => studentModal.classList.remove('active'));
    document.getElementById('cancelStudentModal').addEventListener('click', () => studentModal.classList.remove('active'));

    document.getElementById('studentForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('studentId').value;
        const name = document.getElementById('modalStudentName').value;
        const cls = document.getElementById('modalStudentClass').value;
        const sec = document.getElementById('modalStudentSection').value;
        const roll = document.getElementById('modalStudentRoll').value;
        const pName = document.getElementById('modalParentName').value;
        const pPhone = document.getElementById('modalParentPhone').value;

        if(id) {
            const student = students.find(s => s.id === parseInt(id));
            if(student) {
                student.name = name; student.class = cls; student.section = sec;
                student.roll_no = roll; student.parent_name = pName; student.parent_phone = pPhone;
            }
        } else {
            students.push({
                id: Date.now(), name: name, class: cls, section: sec,
                roll_no: roll, parent_name: pName, parent_phone: pPhone
            });
        }

        saveData();
        renderStudentTable();
        renderHistoryOptions();
        studentModal.classList.remove('active');
        showToast('Student saved successfully!');
    });

    // Leave Modal
    document.getElementById('openApplyLeaveModal').addEventListener('click', () => {
        const select = document.getElementById('modalLeaveStudentSelect');
        select.innerHTML = '';
        students.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        leaveModal.classList.add('active');
    });

    document.getElementById('closeLeaveModal').addEventListener('click', () => leaveModal.classList.remove('active'));
    document.getElementById('cancelLeaveModal').addEventListener('click', () => leaveModal.classList.remove('active'));

    document.getElementById('leaveForm').addEventListener('submit', (e) => {
        e.preventDefault();
        leaveRequests.push({
            id: Date.now(),
            student_id: parseInt(document.getElementById('modalLeaveStudentSelect').value),
            from_date: document.getElementById('modalLeaveFromDate').value,
            to_date: document.getElementById('modalLeaveToDate').value,
            reason: document.getElementById('modalLeaveReason').value,
            status: 'Pending'
        });
        saveData();
        renderLeaveTable();
        leaveModal.classList.remove('active');
        showToast('Leave applied successfully!');
    });
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    document.getElementById('studentId').value = student.id;
    document.getElementById('modalStudentName').value = student.name;
    document.getElementById('modalStudentClass').value = student.class;
    document.getElementById('modalStudentSection').value = student.section;
    document.getElementById('modalStudentRoll').value = student.roll_no;
    document.getElementById('modalParentName').value = student.parent_name;
    document.getElementById('modalParentPhone').value = student.parent_phone;

    document.getElementById('studentModalTitle').innerText = 'Edit Student';
    document.getElementById('studentModal').classList.add('active');
}