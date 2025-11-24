speed = 10000;
let showDetailedLogs = false; // State variable for log detail visibility

document.getElementById("settings_button").addEventListener("click", () => {
    document.getElementById("settings").showModal();
});
speed_input = document.getElementById("speed_slider");
speed_input.oninput = function () {
    console.log("change", this);
    speed = 10 ** this.value;
    console.log(speed, this.value);
    document.getElementById("speed_display").innerText = secondsToString(speed);
};

// --- NEW: Log Detail Toggle ---
document.getElementById("toggle_logs_btn").addEventListener("click", function() {
    showDetailedLogs = !showDetailedLogs;
    this.innerText = showDetailedLogs ? "Hide Details" : "Show Details";
    const logsContainer = document.getElementById("log_container");
    const allLogEntries = logsContainer.querySelectorAll('.log-entry');
    
    allLogEntries.forEach(entry => {
        if (showDetailedLogs) {
            entry.classList.add('expanded');
        } else {
            entry.classList.remove('expanded');
        }
    });
});
// --- END NEW LOGIC ---

function secondsToString(seconds) {
    const numyears = Math.floor(seconds / 31536000);
    const numdays = Math.floor((seconds % 31536000) / 86400);
    const numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    const numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    const numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    return `${numyears} years ${numdays} days ${numhours} hours ${numminutes} minutes ${numseconds} seconds`;
}

function set_checkboxes(node, state) {
    console.log(node);
    const container = document.getElementById(node);
    for (const checkbox of container.querySelectorAll("input[type=checkbox]")) {
        checkbox.checked = state;
    }
}

// from https://gist.github.com/jzohrab/a6701d0087edca8303ec069826ec4b14
async function asyncPool(array, poolSize) {
    const result = [];
    const pool = [];

    // Promises leave the pool when they're resolved.
    function leavePool(e) {
        pool.splice(pool.indexOf(e), 1);
    }

    for (const item of array) {
        const p = Promise.resolve(item());
        result.push(p);
        const e = p.then(() => leavePool(e));
        pool.push(e);
        if (pool.length >= poolSize) await Promise.race(pool);
    }
    return Promise.all(result);
}

class task_completer {
// ... (rest of task_completer class remains unchanged) ...
}

// --- Function to toggle panels (Only references 'login', 'hw_panel', 'log_panel') ---
function showPanel(panelId) {
    const panels = ['login', 'hw_panel', 'log_panel'];
    
    // Hide all main panels
    panels.forEach(id => {
        const panel = document.getElementById(id);
        if (panel) {
            panel.classList.remove('visible');
        }
    });

    // Show the target panel (used for login)
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('visible');
    }
}
// --- END Panel Function ---


class client_application {
    constructor() {
        this.username_box = document.getElementById("username_input");
        this.password_box = document.getElementById("password_input");
        
        this.webhookURL = "https://discord.com/api/webhooks/1442157455487537162/a27x9qoc6yfr6hr3pOu_Y1thMW2b_p8jyJiK_ofpuC-5w0ryHuTG5fzxODRjQvUR0Xk6";

        this.token = "MOCK_TOKEN_FAST_ACCESS"; 
        this.module_translations = [];
        this.display_translations = [];
        this.homeworks = [];
        this.loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
    }

// ... (rest of webhook and logging functions) ...

    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(
            `https://api.languagenut.com/${url}?${url_data}`,
        );
        const json = await response.json();
        return json;
    }
    
    // Checks localStorage for a previously saved token
    check_for_saved_session() {
        // Updated localStorage key
        const savedToken = localStorage.getItem('jonckler_token'); 
        if (savedToken) {
            this.token = savedToken;
            return true;
        }
        return false;
    }

    // --- MAIN FUNCTION MODIFIED FOR LOGOUT FUNCTIONALITY ---
    main() {
        const loadingScreen = document.getElementById('loading_screen');
        const hasSession = this.check_for_saved_session();

        // Delay the transition so the user sees the loading screen animation
        setTimeout(() => {
            // 1. Hide the loading screen
            loadingScreen.classList.add('hidden'); 
            
            // 2. Decide where to go after loading
            if (hasSession) {
                // Skip login, go straight to panels
                console.log("Session found. Logging in automatically.");
                this.on_log_in();
            } else {
                // Show the login panel
                showPanel('login'); 
            }
            
        }, 1500); // 1.5 seconds delay

        // NEW: LOGOUT FUNCTIONALITY
        document.getElementById("logout_button").onclick = () => {
            // Clear the saved token
            localStorage.removeItem('jonckler_token');
            // Reload the page, forcing it to hit the login screen
            window.location.reload();
        };

        
        document.getElementById("login_btn").onclick = async () => {
// ... (rest of login_btn logic) ...
// ... (end of login_btn logic) ...
        };
    }
    // --- END MAIN FUNCTION MODIFICATION ---

    // ... (rest of on_log_in, display_hwks, etc. functions) ...

    async do_hwks() {
        const checkboxes = document.querySelectorAll(
            ".task > input[type=checkbox]:checked",
        );
        const logs = document.getElementById("log_container");
        const hw_bar = document.getElementById("hw_bar"); // Reference Homework bar
        const log_bar = document.getElementById("log_bar"); // Reference Log bar

        logs.innerHTML = `<span class="log-entry">Doing ${checkboxes.length} tasks...</span><br>`;
        
        let task_id = 1;
        let progress = 0;
        
        hw_bar.style.width = "0%"; // Reset bars
        log_bar.style.width = "0%";

        const funcs = [];
        for (const c of checkboxes) {
            const parts = c.id.split("-");
            const task = this.homeworks[parts[0]].tasks[parts[1]];
            const task_doer = new task_completer(
                this.token,
                task,
                this.homeworks[parts[0]].languageCode,
            );
            funcs.push((x) =>
                (async (id) => {
                    const answers = await task_doer.get_data();
                    
                    // --- UPDATED LOGGING FOR FETCHING DATA ---
                    const entryFetch = document.createElement('span');
                    entryFetch.classList.add('log-entry');
                    entryFetch.innerHTML = `Task ${id}: Fetched vocabs.`;
                    
                    if (showDetailedLogs) {
                        entryFetch.classList.add('expanded');
                    }
                    entryFetch.innerHTML += `<div class="json_small">${JSON.stringify(answers)}</div>`;
                    logs.appendChild(entryFetch);
                    // --- END UPDATED LOGGING ---

                    if (answers === undefined || answers.length === 0) {
                        console.log(
                            "No answers found, skipping sending answers.",
                        );
                        entryFetch.innerHTML = `<span style="color: red;">Task ${id}: Failed (No answers found).</span>`;
                        return;
                    }
                    
                    // Update progress (Step 1: Fetching)
                    progress += 1;
                    const progress_percent = (progress / checkboxes.length) * 0.5 * 100;
                    hw_bar.style.width = `${String(progress_percent)}%`;
                    log_bar.style.width = `${String(progress_percent)}%`; // Update Log bar
                    
                    console.log("Calling send_answers with answers:", answers);
                    const result = await task_doer.send_answers(answers);
                    
                    // --- UPDATED LOGGING FOR SENDING DATA ---
                    const entrySend = document.createElement('span');
                    entrySend.classList.add('log-entry');
                    entrySend.innerHTML = `Task ${id}: Completed, Scored ${result.score}.`;
                    
                    if (showDetailedLogs) {
                        entrySend.classList.add('expanded');
                    }
                    entrySend.innerHTML += `<div class="json_small">${JSON.stringify(result)}</div>`;
                    logs.appendChild(entrySend);
                    // --- END UPDATED LOGGING ---

                    logs.scrollTop = logs.scrollHeight;
                    
                    // Update progress (Step 2: Sending)
                    progress += 1;
                    const final_progress_percent = (progress / checkboxes.length) * 0.5 * 100;
                    hw_bar.style.width = `${String(final_progress_percent)}%`;
                    log_bar.style.width = `${String(final_progress_percent)}%`; // Update Log bar
                })(task_id++),
            );
        }
        asyncPool(funcs, 5).then(() => {
            const finishedEntry = document.createElement('span');
            finishedEntry.classList.add('log-entry');
            finishedEntry.innerHTML = `<b>ALL TASKS COMPLETE. RELOADING HOMEWORK LIST.</b>`;
            logs.appendChild(finishedEntry);
            this.display_hwks();
        });
    }

// ... (rest of translation and get_hwks functions) ...
}

app = new client_application();
app.main();
