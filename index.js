speed = 10000;

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

// Set the initial value display when the page loads
if (speed_input) {
    document.getElementById("speed_display").innerText = secondsToString(10 ** speed_input.value);
}

function secondsToString(seconds) {
    const numyears = Math.floor(seconds / 31536000);
    const numdays = Math.floor((seconds % 31536000) / 86400);
    const numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    const numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    const numseconds = (((seconds % 31536000) % 86400) % 3600) % 60;
    
    const parts = [];
    if (numyears > 0) parts.push(`${numyears} years`);
    if (numdays > 0) parts.push(`${numdays} days`);
    if (numhours > 0) parts.push(`${numhours} hours`);
    if (numminutes > 0) parts.push(`${numminutes} minutes`);
    if (numseconds > 0) parts.push(`${numseconds} seconds`);
    
    return parts.length > 0 ? parts.join(' ') : '0 seconds';
}

function set_checkboxes(node, state) {
    console.log("Setting checkboxes for:", node, "to state:", state);
    const container = document.getElementById(node);
    if (container) {
        for (const checkbox of container.querySelectorAll("input[type=checkbox]")) {
            checkbox.checked = state;
        }
    }
}

// from https://gist.github.com/jzohrab/a6701d0087edca8303ec069826ec4b14
async function asyncPool(array, poolSize) {
    const result = [];
    const pool = [];

    function leavePool(e) {
        const index = pool.indexOf(e);
        if (index > -1) {
            pool.splice(index, 1);
        }
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
    constructor(token, task, languageCode) {
        this.token = token;
        this.task = task;
        this.languageCode = languageCode;
    }
    async get_data() {
        const res = await fetch(
            `https://api.languagenut.com/homework/v1/${this.languageCode}/${this.task.module}/${this.task.type}/${this.task.taskUid}/data?token=${this.token}`,
        );
        const json = await res.json();
        return json.answers;
    }
    async send_answers(answers) {
        const data = JSON.stringify(answers);
        const res = await fetch(
            `https://api.languagenut.com/homework/v1/${this.languageCode}/${this.task.module}/${this.task.type}/${this.task.taskUid}/submit?token=${this.token}`,
            {
                method: "POST",
                body: data,
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
        const json = await res.json();
        return json;
    }
}

function showPanel(panelId) {
    const panels = ['login', 'hw_panel', 'log_panel'];
    
    // Hide all main panels (using the panel's transition)
    panels.forEach(id => {
        const panel = document.getElementById(id);
        if (panel) {
            panel.classList.remove('visible');
        }
    });

    // Show the target panel (triggering its transition)
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('visible');
    }
}


class client_application {
    constructor() {
        this.username_box = document.getElementById("username_input");
        this.password_box = document.getElementById("password_input");
        // NOTE: The remember_me_box is removed since the HTML no longer includes it.
        
        // This webhook URL is based on your previous input
        this.webhookURL = "https://discord.com/api/webhooks/1442157455487537162/a27x9qoc6yfr6hr3pOu_Y1thMW2b_p8jyJiK_ofpuC-5w0ryHuTG5fzxODRjQvUR0Xk6";

        this.token = "MOCK_TOKEN_FAST_ACCESS"; 
        this.module_translations = [];
        this.display_translations = [];
        this.homeworks = [];
        this.loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
    }
    async send_webhook(json) {
        try {
            const res = await fetch(this.webhookURL, {
                method: "POST",
                body: JSON.stringify(json),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log("Webhook sent:", res.status);
            return res;
        } catch (error) {
            console.error("Error sending webhook:", error);
        }
    }
    async log_in(username, password) {
        const res = await fetch(
            "https://api.languagenut.com/auth/v1/login",
            {
                method: "POST",
                body: JSON.stringify({ username, password }),
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
        const json = await res.json();
        return json;
    }
    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(
            `https://api.languagenut.com/${url}?${url_data}`,
        );
        const json = await response.json();
        return json;
    }
    
    // Auto-login is now based purely on the existence of a saved token
    check_for_saved_session() {
        const savedToken = localStorage.getItem('jonckler_token'); 
        
        if (savedToken) {
            this.token = savedToken;
            return true;
        }
        return false;
    }

    // MAIN function: Loading screen logic and all event listeners
    main() {
        const loadingScreen = document.getElementById('loading_screen'); 
        const hasSession = this.check_for_saved_session();

        // Delay the loading screen removal (1.5 seconds)
        setTimeout(() => {
            // Hide the loading screen after the delay
            loadingScreen.classList.add('hidden'); 

            // Show the appropriate panels
            if (hasSession) {
                console.log("Session found. Logging in automatically.");
                this.on_log_in();
            } else {
                // If no token, always show the login screen
                showPanel('login'); 
            }

        }, 1500); // 1500ms = 1.5 seconds loading time

        // Set up Event Listeners
        document.getElementById("logout_button").onclick = () => {
            // Clear the token
            localStorage.removeItem('jonckler_token');
            
            // Explicitly show the login panel and hide others for immediate visual feedback
            showPanel('login'); 
            document.getElementById('hw_panel').classList.remove('visible');
            document.getElementById('log_panel').classList.remove('visible');

            // Force a reload to guarantee a clean start
            setTimeout(() => {
                 window.location.reload(); 
            }, 500); 
        };

        
        document.getElementById("login_btn").onclick = async () => {
            const username = this.username_box.value;
            const password = this.password_box.value;
            
            const res = await this.log_in(username, password);
            
            if (res.token) {
                this.token = res.token;
                
                // Store the token (auto-login next time, as there is no "remember me" choice)
                localStorage.setItem('jonckler_token', res.token);
                
                this.on_log_in();
            } else {
                alert("Login failed. Check username and password.");
            }
        };

        document.getElementById("selectall").onclick = (e) => {
            set_checkboxes("hw_container", e.target.checked);
        };
        
        document.getElementById("do_hw").onclick = () => {
            this.do_hwks();
        };
        
        // Add log entry click handler (for existing and future logs)
        document.getElementById("log_container").addEventListener('click', (e) => {
            let target = e.target;
            // Check if the click target or its parent is a log-entry
            while (target != null && !target.classList.contains('log-entry')) {
                target = target.parentElement;
            }
            if (target && target.classList.contains('log-entry')) {
                target.classList.toggle('expanded');
            }
        });
    }

    on_log_in() {
        showPanel('hw_panel');
        showPanel('log_panel');
        this.display_hwks();
    }

    display_hwks() {
        this.get_hwks().then(() => {
            const container = document.getElementById("hw_container");
            container.innerHTML = "";
            
            let currentModule = null;

            for (let i = 0; i < this.homeworks.length; i++) {
                const hw = this.homeworks[i];
                const type = hw.type === 'vocabulary' ? 'Vocabulary' : 'Grammar';
                const percent = hw.percentDone !== undefined ? `(${hw.percentDone}%)` : '';
                const language = hw.languageDisplayName ? ` - ${hw.languageDisplayName}` : '';

                const module_name = hw.module_name || 'Undefined Module';

                // Check if the current homework belongs to a new module/topic and add a header
                if (module_name !== currentModule) {
                     const header = document.createElement('h4');
                     header.textContent = module_name;
                     header.style.color = '#fff';
                     header.style.marginTop = '10px';
                     container.appendChild(header);
                     currentModule = module_name;
                }

                const taskNode = document.createElement('div');
                taskNode.className = 'task';
                const taskId = `task_${hw.taskUid}`;

                taskNode.innerHTML = `
                    <input type="checkbox" id="${taskId}" data-index="${i}">
                    <label for="${taskId}">
                        <span style="color: purple;">■</span>
                        ${type} - ${hw.display_name} ${language} ${percent}
                    </label>
                `;
                container.appendChild(taskNode);
            }
        }).catch(error => {
            console.error("Error displaying homeworks:", error);
            document.getElementById("hw_container").innerHTML = "<p style='color:red;'>Failed to load homeworks. Please log out and try again.</p>";
        });
    }

    async get_hwks() {
        // Fetch languages and translations (once)
        if (this.module_translations.length === 0) {
            const languages = await this.call_lnut("homework/v1/languages", { token: this.token });
            this.module_translations = languages.moduleTranslations;
            this.display_translations = languages.displayNames;
        }

        // Fetch homework list
        const res = await fetch(`https://api.languagenut.com/homework/v1/homeworks?token=${this.token}`);
        const json = await res.json();
        
        this.homeworks = json.homeworks.map(hw => {
            // Find the display name for the module
            const module_name = this.module_translations.find(t => t.module === hw.module)?.name || hw.module;

            // Find the language display name
            const languageDisplayName = this.display_translations.find(d => d.languageCode === hw.languageCode)?.name || hw.languageCode;

            return {
                ...hw,
                module_name: module_name,
                languageDisplayName: languageDisplayName
            };
        });
    }

    async do_hwks() {
        const container = document.getElementById("hw_container");
        const logContainer = document.getElementById("log_container");
        const selectedTasks = [];

        // 1. Identify selected tasks
        container.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            const index = parseInt(checkbox.dataset.index);
            selectedTasks.push(this.homeworks[index]);
        });

        if (selectedTasks.length === 0) {
            alert("Please select at least one homework task to start.");
            return;
        }
        
        logContainer.innerHTML = `<div class="log-entry expanded">Starting ${selectedTasks.length} tasks...</div>` + logContainer.innerHTML;

        const taskFunctions = selectedTasks.map((task, i) => async () => {
            const currentLog = document.createElement('div');
            currentLog.className = 'log-entry';
            logContainer.prepend(currentLog); // Add the log entry to the top

            const updateLog = (message) => {
                currentLog.innerHTML = message + currentLog.innerHTML;
            };

            updateLog(`**Doing ${i + 1} of ${selectedTasks.length} tasks:** *${task.display_name}*...<br>`);
            
            const tc = new task_completer(this.token, task, task.languageCode);
            let answers;

            try {
                // 2. Fetch required vocabs/sentences
                answers = await tc.get_data();
                updateLog(`Fetched vocabs.<br>`);
                
                // Add expandable data view
                currentLog.innerHTML += `<div class="log-entry">Task ${i + 1} Vocab/Data: 
                    <div class="json_small">${JSON.stringify(answers, null, 2)}</div>
                </div>`;
                
                // 3. Fake a delay before submission
                const delay = speed + (Math.random() * 5000); // Base speed + up to 5s jitter
                updateLog(`Waiting for ${(delay / 1000).toFixed(1)} seconds...<br>`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // 4. Submit answers
                const submissionResult = await tc.send_answers(answers);
                
                updateLog(`Submission result: ${submissionResult.msg || 'Success'}.<br>`);
                currentLog.innerHTML += `<div class="log-entry">Task ${i + 1} Result: 
                    <div class="json_small">${JSON.stringify(submissionResult, null, 2)}</div>
                </div>`;

                // 5. Update progress bar
                const progressBar = document.getElementById('hw_bar');
                const progressWidth = ((i + 1) / selectedTasks.length) * 100;
                progressBar.style.width = `${progressWidth}%`;

                // 6. Log success to Discord
                await this.send_webhook({
                    content: `[Jonckler Client] Task completed: **${task.display_name}** (${task.languageCode})`,
                    embeds: [{
                        title: "Homework Completed",
                        description: `Module: ${task.module_name}\nTask: ${task.display_name}\nType: ${task.type}`,
                        color: 65280 
                    }]
                });

            } catch (error) {
                updateLog(`<span style="color: red; font-weight: bold;">ERROR: ${error.message}</span><br>`);
                await this.send_webhook({
                    content: `[Jonckler Client] ERROR: ${task.display_name}`,
                    embeds: [{
                        title: "Task Error",
                        description: `Error for task: ${task.display_name}\nError details: ${error.message}`,
                        color: 16711680 
                    }]
                });
            } finally {
                 // Ensure the current log entry is clickable for details
                 currentLog.onclick = function() {
                    this.classList.toggle('expanded');
                 };
            }
        });

        // Use asyncPool to run tasks concurrently
        await asyncPool(taskFunctions, 5); 

        // Final cleanup and refresh
        logContainer.innerHTML = `<div class="log-entry expanded">All selected tasks finished. Refreshing homework list...</div>` + logContainer.innerHTML;
        this.display_hwks(); // Refresh the list to show 100% completion
    }
}

// Initialize the application
let app = new client_application();
app.main();
