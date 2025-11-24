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
    async send_webhook(json) {
        const res = await fetch(this.webhookURL, {
            method: "POST",
            body: JSON.stringify(json),
            headers: {
                "Content-Type": "application/json",
            },
        });
        return res;
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
    
    check_for_saved_session() {
        const savedToken = localStorage.getItem('jonckler_token'); 
        if (savedToken) {
            this.token = savedToken;
            return true;
        }
        return false;
    }

    main() {
        const loadingScreen = document.getElementById('loading_screen');
        const hasSession = this.check_for_saved_session();

        // Delay the transition so the user sees the loading screen animation
        setTimeout(() => {
            loadingScreen.classList.add('hidden'); 
            
            if (hasSession) {
                console.log("Session found. Logging in automatically.");
                this.on_log_in();
            } else {
                showPanel('login'); 
            }
            
        }, 1500); // 1.5 seconds delay

        // LOGOUT FUNCTIONALITY
        document.getElementById("logout_button").onclick = () => {
            localStorage.removeItem('jonckler_token');
            window.location.reload();
        };

        
        document.getElementById("login_btn").onclick = async () => {
            const username = this.username_box.value;
            const password = this.password_box.value;
            
            const res = await this.log_in(username, password);
            
            if (res.token) {
                this.token = res.token;
                localStorage.setItem('jonckler_token', res.token); // Save token
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
            
            for (let i = 0; i < this.homeworks.length; i++) {
                const h = this.homeworks[i];
                const title = document.createElement("h3");
                title.innerText = h.title;
                title.style.color = "lightgray";
                container.appendChild(title);
                
                for (let j = 0; j < h.tasks.length; j++) {
                    const task = h.tasks[j];
                    const taskDiv = document.createElement("div");
                    taskDiv.className = "task";
                    
                    taskDiv.innerHTML = `
                        <input type="checkbox" id="${i}-${j}" />
                        <label for="${i}-${j}">${task.display_name} (${task.completion_percentage}%)</label>
                    `;
                    container.appendChild(taskDiv);
                }
            }
        });
    }

    async do_hwks() {
        const checkboxes = document.querySelectorAll(
            ".task > input[type=checkbox]:checked",
        );
        const logs = document.getElementById("log_container");
        const hw_bar = document.getElementById("hw_bar");
        const log_bar = document.getElementById("log_bar");

        // Initial message
        logs.innerHTML = `<div class="log-entry">Doing ${checkboxes.length} tasks...</div>`;
        logs.scrollTop = logs.scrollHeight;
        
        let task_id = 1;
        let progress = 0;
        
        hw_bar.style.width = "0%";
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
                    // --- Create the main log entry container ---
                    const entryContainer = document.createElement('div');
                    entryContainer.classList.add('log-entry');
                    logs.appendChild(entryContainer);

                    // --- Add the click handler to toggle details ---
                    entryContainer.onclick = () => {
                        entryContainer.classList.toggle('expanded');
                    };

                    // Initial summary message (Fetching)
                    entryContainer.innerHTML = `Task ${id}: **Fetching data...**`;

                    const answers = await task_doer.get_data();
                    
                    // Add fetched JSON data
                    const jsonSmallFetch = document.createElement('div');
                    jsonSmallFetch.classList.add('json_small');
                    jsonSmallFetch.textContent = JSON.stringify(answers, null, 2);
                    entryContainer.appendChild(jsonSmallFetch);

                    if (answers === undefined || answers.length === 0) {
                        console.log("No answers found, skipping sending answers.");
                        entryContainer.innerHTML = `Task ${id}: <span style="color: red;">Failed (No answers found).</span>`;
                        logs.scrollTop = logs.scrollHeight;
                        return;
                    }
                    
                    // Update summary message after success
                    entryContainer.innerHTML = `Task ${id}: Fetched ${answers.length} vocabs. Click for JSON details.`;
                    
                    // Update progress (Step 1: Fetching)
                    progress += 1;
                    let progress_percent = (progress / checkboxes.length) * 0.5 * 100;
                    hw_bar.style.width = `${String(progress_percent)}%`;
                    log_bar.style.width = `${String(progress_percent)}%`;
                    
                    // Change summary message to indicate next step (Sending)
                    entryContainer.innerHTML = `Task ${id}: **Sending answers...** Click for JSON details.`;

                    console.log("Calling send_answers with answers:", answers);
                    const result = await task_doer.send_answers(answers);
                   
                    // Add sent JSON data
                    const jsonSmallSend = document.createElement('div');
                    jsonSmallSend.classList.add('json_small');
                    jsonSmallSend.textContent = JSON.stringify(result, null, 2);
                    entryContainer.appendChild(jsonSmallSend);

                    // Final summary message
                    entryContainer.innerHTML = `Task ${id}: Completed, Scored **${result.score}**. Click for JSON details.`;
                    
                    logs.scrollTop = logs.scrollHeight;
                    
                    // Update progress (Step 2: Sending)
                    progress += 1;
                    progress_percent = (progress / checkboxes.length) * 0.5 * 100;
                    hw_bar.style.width = `${String(progress_percent)}%`;
                    log_bar.style.width = `${String(progress_percent)}%`;
                })(task_id++),
            );
        }
        asyncPool(funcs, 5).then(() => {
            const finishedEntry = document.createElement('div');
            finishedEntry.classList.add('log-entry');
            finishedEntry.innerHTML = `<b>ALL TASKS COMPLETE. RELOADING HOMEWORK LIST.</b>`;
            logs.appendChild(finishedEntry);
            logs.scrollTop = logs.scrollHeight;
            this.display_hwks();
        });
    }

    async get_hwks() {
        const res = await this.call_lnut(
            "homework/v1/list",
            { token: this.token },
        );
        this.homeworks = res.homeworks;
    }
}

app = new client_application();
app.main();
