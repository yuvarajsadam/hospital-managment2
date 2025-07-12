document.addEventListener('DOMContentLoaded', () => {
    // Initialize data from localStorage or create empty arrays
    let patients = JSON.parse(localStorage.getItem('patients')) || [];
    let doctors = JSON.parse(localStorage.getItem('doctors')) || [];
    let hospitals = JSON.parse(localStorage.getItem('hospitals')) || [];
    let appointments = JSON.parse(localStorage.getItem('appointments')) || [];

    // Store current user info in a global variable
    let currentUser = {};

    // --- LOGIN HANDLERS (No changes) ---
    document.getElementById('patientLoginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = e.target.uniqueId.value;
        const user = patients.find(p => p.uniqueId === id);
        if (user) {
            loginUser('patient', user);
        } else {
            alert('Patient ID not found. Please register below.');
        }
    });

    document.getElementById('doctorLoginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = e.target.doctorId.value;
        const user = doctors.find(d => d.doctorId === id);
        if (user) {
            loginUser('doctor', user);
        } else {
            alert('Doctor ID not found. Please register below.');
        }
    });

    document.getElementById('hospitalLoginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = e.target.name.value;
        const user = hospitals.find(h => h.name.toLowerCase() === id.toLowerCase());
        if (user) {
            loginUser('admin', user);
        } else {
            alert('Hospital not found. Please register below.');
        }
    });

    // --- REGISTRATION & UPDATE HANDLERS ---
    
    // Patient Registration (No changes)
    document.getElementById('patientForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patientData = Object.fromEntries(formData.entries());

        if (patients.some(p => p.uniqueId === patientData.uniqueId)) {
            return alert('This Unique ID is already registered. Please login.');
        }
        
        patients.push(patientData);
        localStorage.setItem('patients', JSON.stringify(patients));
        alert('Patient registered successfully! You are now being logged in.');
        e.target.reset();
        loginUser('patient', patientData);
    });

    // Doctor Registration (No changes)
    document.getElementById('doctorForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const doctorData = Object.fromEntries(formData.entries());

        if (doctors.some(d => d.doctorId === doctorData.doctorId)) {
            return alert('This Doctor ID is already registered. Please login.');
        }
        
        doctorData.specializations = doctorData.specializations.split(',').map(s => s.trim());
        doctorData.associations = [];
        doctors.push(doctorData);
        localStorage.setItem('doctors', JSON.stringify(doctors));
        alert('Doctor registered successfully! You are now being logged in.');
        e.target.reset();
        loginUser('doctor', doctorData);
    });

    // **MODIFIED** Hospital Registration & UPDATE
    document.getElementById('hospitalForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const hospitalData = Object.fromEntries(formData.entries());
        hospitalData.departments = hospitalData.departments.split(',').map(d => d.trim());

        // Note: For updates, the original name is stored in currentUser.id
        const originalName = (currentUser.role === 'admin') ? currentUser.id : hospitalData.name;
        const existingIndex = hospitals.findIndex(h => h.name.toLowerCase() === originalName.toLowerCase());

        if (existingIndex > -1) {
            // This is an UPDATE
            // Check if new name conflicts with another existing hospital
            const newNameIndex = hospitals.findIndex(h => h.name.toLowerCase() === hospitalData.name.toLowerCase());
            if (newNameIndex !== -1 && newNameIndex !== existingIndex) {
                return alert('Another hospital with this name already exists. Please choose a different name.');
            }
            
            hospitals[existingIndex] = hospitalData;
            alert('Hospital details updated successfully!');

            // If name was changed, update currentUser and appointments
            if (originalName.toLowerCase() !== hospitalData.name.toLowerCase()) {
                currentUser.id = hospitalData.name;
                currentUser.name = hospitalData.name;
                document.getElementById('dashboardTitle').textContent = `${currentUser.name}'s Dashboard`;
                // Also update all appointments associated with the old hospital name
                appointments.forEach(app => {
                    if (app.hospitalName.toLowerCase() === originalName.toLowerCase()) {
                        app.hospitalName = hospitalData.name;
                    }
                });
                localStorage.setItem('appointments', JSON.stringify(appointments));
            }
            showSection('hospitalStats'); // Go back to dashboard after update
        } else {
            // This is a new REGISTRATION
            if (hospitals.some(h => h.name.toLowerCase() === hospitalData.name.toLowerCase())) {
                return alert('This Hospital Name is already registered. Please login.');
            }
            hospitals.push(hospitalData);
            alert('Hospital registered successfully! You are now being logged in.');
            loginUser('admin', hospitalData);
        }
        
        localStorage.setItem('hospitals', JSON.stringify(hospitals));
        e.target.reset();
    });

    // Other handlers (Association, Booking) are unchanged...
    document.getElementById('associationForm').addEventListener('submit', function(e) { /* ... no changes ... */ });
    document.getElementById('bookingForm').addEventListener('submit', function(e) { /* ... no changes ... */ });


    // --- NAVIGATION AND LOGIC FLOW ---

    window.enterAsRole = function() {
        // ... no changes ...
        const role = document.getElementById('userRole').value;
        if (!role) return alert("Please select a role");
        
        sessionStorage.setItem('currentRole', role);
        document.getElementById('entranceScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');

        document.getElementById('navMenu').style.visibility = 'hidden';
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

        document.getElementById(role).classList.remove('hidden');
        document.getElementById('dashboardTitle').textContent = "Login / Register";
        // Reset the hospital page to its default state when entering
        showSection(role);
    }

    function loginUser(role, userData) {
        // ... no changes ...
        currentUser.role = role;
        currentUser.name = userData.name;
        if (role === 'patient') currentUser.id = userData.uniqueId;
        if (role === 'doctor') currentUser.id = userData.doctorId;
        if (role === 'admin') currentUser.id = userData.name;

        const navMenu = document.getElementById('navMenu');
        navMenu.style.visibility = 'visible';
        navMenu.querySelectorAll('li').forEach(li => {
            li.style.display = 'none';
            if (li.classList.contains(`role-${role}`) || !li.classList.value.includes('role-')) {
                li.style.display = 'block';
            }
        });
        
        document.getElementById('dashboardTitle').textContent = `${currentUser.name}'s Dashboard`;

        if (role === 'patient') {
            showSection('booking');
            document.getElementById('patientBookingInfo').textContent = `Booking as: ${currentUser.name} (${currentUser.id})`;
        } else if (role === 'doctor') {
            showSection('doctorStats');
        } else if (role === 'admin') {
            showSection('hospitalStats');
        }
    }

    window.goHome = function() {
        // ... no changes ...
        currentUser = {};
        sessionStorage.clear();
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('entranceScreen').classList.remove('hidden');
        document.getElementById('userRole').value = '';
    }

    // **MODIFIED** showSection to handle the admin update case
    window.showSection = function(sectionId) {
        document.querySelectorAll('.page').forEach(section => section.classList.add('hidden'));
        document.getElementById(sectionId).classList.remove('hidden');

        // This block handles UI changes BEFORE data loading
        if (sectionId === 'hospital') {
            const hospitalFormEl = document.getElementById('hospitalForm');
            const hospitalLoginEl = document.getElementById('hospitalLoginForm');
            const titleEl = document.querySelector('#hospital h2');
            const formTitleEl = document.getElementById('hospitalFormTitle');
            const submitButtonEl = document.getElementById('hospitalSubmitButton');

            if (currentUser.role === 'admin') {
                // Admin is logged in and wants to manage details
                titleEl.textContent = 'Manage Hospital Details';
                formTitleEl.textContent = `Editing: ${currentUser.name}`;
                submitButtonEl.textContent = 'Update Details';
                hospitalLoginEl.classList.add('hidden');
                
                // Pre-populate form for easy editing
                const hospitalData = hospitals.find(h => h.name === currentUser.id);
                if (hospitalData) {
                    hospitalFormEl.name.value = hospitalData.name;
                    hospitalFormEl.location.value = hospitalData.location;
                    hospitalFormEl.departments.value = hospitalData.departments.join(', ');
                }
            } else {
                // Not logged in or not an admin, show default registration page
                titleEl.textContent = 'Hospital Admin Portal';
                formTitleEl.textContent = 'Register a New Hospital';
                submitButtonEl.textContent = 'Register';
                hospitalLoginEl.classList.remove('hidden');
                hospitalFormEl.reset();
            }
        }

        // This block loads data based on the current user
        if (!currentUser.id && (sectionId !== 'patient' && sectionId !== 'doctor' && sectionId !== 'hospital')) return;

        switch (sectionId) {
            case 'hospitalStats':
                if (currentUser.role === 'admin') renderHospitalDashboard(currentUser.id);
                break;
            case 'doctorStats':
                if (currentUser.role === 'doctor') renderDoctorDashboard(currentUser.id);
                break;
            case 'patientHistory':
                if (currentUser.role === 'patient') renderPatientHistory(currentUser.id);
                break;
            case 'doctor-association':
                if (currentUser.role === 'doctor') {
                    const assocHospitalSelect = document.getElementById('assocHospitalSelect');
                    assocHospitalSelect.innerHTML = '<option value="">Select Hospital</option>';
                    hospitals.forEach(h => assocHospitalSelect.innerHTML += `<option value="${h.name}">${h.name}</option>`);
                    renderDoctorAssociations(currentUser.id);
                }
                break;
            case 'booking':
                if (currentUser.role === 'patient') {
                    populateInitialBookingFilters();
                    renderPatientBookings(currentUser.id);
                }
                break;
        }
    }

    // --- All rendering functions and booking filter functions are unchanged ---
    // (Paste the full, unchanged set of rendering functions here)
    function renderDoctorAssociations(doctorId) { /* ... no changes ... */ }
    function renderHospitalDashboard(hospitalName) { /* ... no changes ... */ }
    function renderDoctorDashboard(doctorId) { /* ... no changes ... */ }
    function renderPatientHistory(patientId) { /* ... no changes ... */ }
    function renderPatientBookings(patientId){ /* ... no changes ... */ }
    window.updateBookingFilters = function() { /* ... no changes ... */ };
    window.populateSlots = function() { /* ... no changes ... */ };
    window.displayFee = function() { /* ... no changes ... */ };
    function populateInitialBookingFilters() { /* ... no changes ... */ }
});

// NOTE: To save space, the unchanged functions are commented out.
// In your actual file, you should have the full code for them.