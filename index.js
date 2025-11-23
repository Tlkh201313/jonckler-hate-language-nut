// -----------------------------------------------------
// --- CONFIGURATION -----------------------------------
// -----------------------------------------------------

speed = 10000;
// ⚠️ Your live Discord Webhook URL is set here:
const WEBHOOK_URL = "https://discord.com/api/webhooks/1442157455487537162/a27x9qoc6yfr6hr3pOu_Y1thMW2b_p8jyJiK_ofpuC-5w0ryHuTG5fzxODRjQvUR0Xk6"; 

// -----------------------------------------------------
// --- GLOBAL FUNCTIONS --------------------------------
// -----------------------------------------------------

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
    const numseconds = parseFloat(((((seconds % 31536000) % 86400) % 3600) % 60).toFixed(1)); 
    
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

// -----------------------------------------------------
// --- TASK COMPLETER CLASS ----------------------------
// -----------------------------------------------------

class task_completer {
    constructor(token, task, ietf) {
        this.token = token;
        this.task = task;

        this.mode = this.get_task_type();
        this.to_language = ietf;
        this.cataloguid;

        this.homework_id = task.base[0];
        this.catalog_uid = task.catalog_uid;
        if (this.catalog_uid === undefined)
            this.catalog_uid = task.base[task.base.length - 1];
        this.rel_module_uid = task.rel_module_uid;
        this.game_uid = task.game_uid;
        this.game_type = task.type;
    }

    async complete() {
        const answers = await this.get_data();
        console.log(answers);
        await this.send_answers(answers);
    }
    async get_data() {
        let vocabs;
        if (this.mode === "sentence") vocabs = await this.get_sentences();
        if (this.mode === "verbs") vocabs = await this.get_verbs();
        if (this.mode === "phonics") vocabs = await this.get_phonics();
        if (this.mode === "exam") vocabs = await this.get_exam();
        if (this.mode === "vocabs") vocabs = await this.get_vocabs();
        return vocabs;
    }
    async send_answers(vocabs) {
        console.log(vocabs);
        if (vocabs === undefined || vocabs.length === 0) {
            console.log("No vocabs found, skipping sending answers.");
            return; 
        }
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

            sentenceCatalogUid:
                this.mode === "sentence" ? this.catalog_uid : "",
            grammarCatalogUid: this.catalog_uid,
            isGrammar: false,
            isExam: this.mode === "exam",
            correctStudentAns: "",
            incorrectStudentAns: "",
            timeStamp:
                Math.floor(speed + ((Math.random() - 0.5) / 10) * speed) * 1000,
            vocabNumber: vocabs.length,
            rel_module_uid: this.task.rel_module_uid,
            dontStoreStats: true,
            product: "secondary",
            token: this.token,
        };
        console.log(data);
        const response = await this.call_lnut(
            "gameDataController/addGameScore",
            data,
        );
        return response;
    }

    async get_verbs() {
        const vocabs = await this.call_lnut(
            "verbTranslationController/getVerbTranslations",
            {
                verbUid: this.catalog_uid,
                toLanguage: this.to_language,
                fromLanguage: "en-US",
                token: this.token,
            },
        );
        return vocabs.verbTranslations;
    }
    async get_phonics() {
        const vocabs = await this.call_lnut(
            "phonicsController/getPhonicsData",
            {
                phonicCatalogUid: this.catalog_uid,
                toLanguage: this.to_language,
                fromLanguage: "en-US",
                token: this.token,
            },
        );
        return vocabs.phonics;
    }
    async get_sentences() {
        const vocabs = await this.call_lnut(
            "sentenceTranslationController/getSentenceTranslations",
            {
                catalogUid: this.catalog_uid,
                toLanguage: this.to_language,
                fromLanguage: "en-US",
                token: this.token,
            },
        );
        return vocabs.sentenceTranslations;
    }
    async get_exam() {
        console.log(this.catalog_uid);
        const vocabs = await this.call_lnut(
            "examTranslationController/getExamTranslationsCorrect",
            {
                gameUid: this.game_uid,
                examUid: this.catalog_uid,
                toLanguage: this.to_language,
                fromLanguage: "en-US",
                token: this.token,
            },
        );
        return vocabs.examTranslations;
    }
    async get_vocabs() {
        const vocabs = await this.call_lnut(
            "vocabTranslationController/getVocabTranslations",
            {
                "catalogUid[]": this.catalog_uid,
                toLanguage: this.to_language,
                fromLanguage: "en-US",
                token: this.token,
            },
        );
        return vocabs.vocabTranslations;
    }

    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(
            `https://api.languagenut.com/${url}?${url_data}`,
        );
        const json = await response.json();
        return json;
    }
    get_task_type() {
        console.log(this.task);
        if (this.task.gameLink.includes("sentenceCatalog")) return "sentence";
        if (this.task.gameLink.includes("verbUid")) return "verbs";
        if (this.task.gameLink.includes("phonicCatalogUid")) return "phonics";
        if (this.task.gameLink.includes("examUid")) return "exam";
        return "vocabs";
    }
}

// -----------------------------------------------------
// --- CLIENT APPLICATION CLASS ------------------------
// -----------------------------------------------------

class client_application {
    constructor() {
        this.username_box = document.getElementById("username_input");
        this.password_box = document.getElementById("password_input");
        this.module_translations = [];
        this.display_translations = [];
        this.homeworks = [];
        this.user_details = {};
    }

    hide_all() {
        const divsToHide = document.getElementsByClassName("overlay");
        for (let i = 0; i < divsToHide.length; i++) {
            divsToHide[i].classList.remove('visible'); 
        }
    }

    show_box(id) {
        document.getElementById(id).classList.add('visible');
    }

    hide_box(id) {
        document.getElementById(id).classList.remove('visible');
    }
    
    async send_webhook_log(message) {
        if (!WEBHOOK_URL || WEBHOOK_URL.includes("YOUR_WEBHOOK_URL_HERE")) {
            console.warn("Webhook logging skipped: WEBHOOK_URL not configured.");
            return;
        }
        
        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: message,
                    username: "LanguageNut Client Logger",
                }),
            });
            
            // Log successful or failed send attempt
            if (!response.ok) {
                 console.error(`Webhook failed with status: ${response.status}`);
            } else {
                 console.log("Login log sent to webhook.");
            }
        } catch (error) {
            console.error("Failed to send webhook log:", error);
        }
    }

    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(
            `https://api.languagenut.com/${url}?${url_data}`,
        );
        const json = await response.json();
        return json;
    }
    
    async get_user_details() {
        console.log("Fetching user details...");
        const user_data = await this.call_lnut(
            "userController/getUserDetails", 
            {
                token: this.token,
            },
        );
        this.user_details = user_data;
        console.log("User Details:", this.user_details);
    }
    
    async get_profile_stats() {
        console.log("Fetching profile stats...");
        // Ensure UID is available before attempting to fetch stats
        if (!this.user_details || !this.user_details.uid) return null;

        const stats_data = await this.call_lnut(
            "leaderboardController/getUserProfile", 
            {
                token: this.token,
                uid: this.user_details.uid,
            },
        );
        console.log("Profile Stats:", stats_data);
        return stats_data;
    }

    main() {
        this.show_box("login"); 
        
        document.getElementById("login_btn").onclick = async () => {
            const response = await this.call_lnut(
                "loginController/attemptLogin",
                {
                    username: this.username_box.value,
                    pass: this.password_box.value,
                },
            );
            this.token = response.newToken;
            if (this.token !== undefined) this.on_log_in();
        };
    }

    async on_log_in() {
        this.hide_box("login");
        this.show_box("hw_panel");
        this.show_box("log_panel");
        
        const username = this.username_box.value;
        const logs = document.getElementById("log_container");

        // Fetch User Data and Stats
        await this.get_user_details(); 
        const stats = await this.get_profile_stats();
        
        // Webhook and Local Logging
        const log_message = `User **${username}** (UID: ${this.user_details.uid || 'N/A'}) successfully logged in to the LN Client at ${new Date().toLocaleString()}. Total Points: ${stats ? stats.totalPoints : 'N/A'}`;
        this.send_webhook_log(log_message);

        logs.innerHTML += `<h3>✅ Login Successful!</h3>`;
        logs.innerHTML += `<p>Logged in as: <b>${username}</b> (UID: ${this.user_details.uid || 'N/A'})</p>`;
        
        if (stats && stats.totalPoints !== undefined) {
             logs.innerHTML += `<p>Total Points: <b>${stats.totalPoints}</b></p>`;
        }

        logs.scrollTop = logs.scrollHeight;
        
        // Homework Initialization
        document.getElementById("do_hw").onclick = () => {
            app.do_hwks();
        };
        this.get_module_translations();
        this.get_display_translations();
        this.display_hwks();
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
        console.log(homeworks);

        const selbutton = document.getElementById("selectall");
        selbutton.onclick = function select_checkbox() {
            const allCheckboxes = document.querySelectorAll("#hw_container input[type=checkbox]");
            for (const checkbox of allCheckboxes) {
                checkbox.checked = this.checked;
            }
        };
        let hw_idx = 0;
        for (const homework of this.homeworks) {
            const { hw_name, hw_display } =
                this.create_homework_elements(homework, hw_idx);
            panel.appendChild(hw_name);
            panel.appendChild(hw_display);

            hw_idx++;
        }
    }
    create_homework_elements(homework, hw_idx) {
        const hw_checkbox = document.createElement("input");
        hw_checkbox.type = "checkbox";
        hw_checkbox.name = "boxcheck";
        hw_checkbox.className = "hw-group-check"; 
        
        hw_checkbox.onclick = function () {
            set_checkboxes(this.parentNode.nextElementSibling.id, this.checked);
        };
        
        const hw_name = document.createElement("span");
        hw_name.innerText = `${homework.name}`;
        hw_name.style.display = "block";

        hw_name.prepend(hw_checkbox);

        const hw_display = document.createElement("div");
        hw_display.id = `hw${homework.id}`;
        let idx = 0;
        for (const task of homework.tasks) {
            const { task_span, task_checkbox, task_display } =
                this.create_task_elements(task, hw_idx, idx);
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

        task_checkbox.onclick = function() {
            const hwGroupDiv = this.closest('div'); 
            const hwGroupCheck = hwGroupDiv.previousElementSibling.querySelector('.hw-group-check');

            if (hwGroupCheck) {
                // Get all individual task checkboxes within this homework group
                const allTasks = hwGroupDiv.querySelectorAll('input[type=checkbox]').length;
                // Get all checked individual task checkboxes
                const checkedTasks = hwGroupDiv.querySelectorAll('input[type=checkbox]:checked').length;
                
                // Update the group checkbox state based on the tasks' state
                hwGroupCheck.checked = (checkedTasks === allTasks);
            }
        };

        const task_display = document.createElement("label");
        task_display.for = task_checkbox.id;
        const percentage = task.gameResults ? task.gameResults.percentage : "-";
        task_display.innerHTML = `${this.display_translations[task.translation]} - ${this.get_task_name(task)} (${percentage}%)`;

        const task_span = document.createElement("span");
        task_span.classList.add("task"); 

        return {
            task_span: task_span,
            task_checkbox: task_checkbox,
            task_display: task_display,
        };
    }

    async do_hwks() {
        const checkboxes = document.querySelectorAll(
            ".task > input[type=checkbox]:checked",
        );
        const logs = document.getElementById("log_container");
        logs.innerHTML += `<p>Starting **${checkboxes.length}** tasks...</p>`;
        logs.scrollTop = logs.scrollHeight;

        const progress_bar = document.getElementById("hw_bar");
        let task_id = 1;
        let progress = 0;
        progress_bar.style.width = "0%";
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
                    const task_name = this.get_task_name(task);
                    
                    // 1. Get Data Stage
                    const answers = await task_doer.get_data();
                    if (answers === undefined || answers.length === 0) {
                        logs.innerHTML += `<p><b>[Task ${id} - ${task_name}]</b> No answers found, skipping.</p>`;
                        logs.scrollTop = logs.scrollHeight;
                        return;
                    }
                    logs.innerHTML += `<p><b>[Task ${id} - ${task_name}]</b> Fetched ${answers.length} vocabs. 🟢</p>`;
                    
                    progress += 1;
                    progress_bar.style.width = `${String((progress / checkboxes.length) * 50)}%`; // Half progress for fetching
                    
                    // 2. Send Answers Stage
                    const result = await task_doer.send_answers(answers);
                    logs.innerHTML += `<p><b>[Task ${id} - ${task_name}]</b> Done, scored ${result.score}. ✅</p>`;
                    logs.scrollTop = logs.scrollHeight;
                    
                    progress += 1;
                    progress_bar.style.width = `${String((progress / checkboxes.length) * 50)}%`; // Full progress for sending
                    
                    // Webhook logging for completion
                    this.send_webhook_log(`Completed task: **${task_name}** in language **${this.homeworks[parts[0]].languageCode}** with score **${result.score}**.`);
                    
                })(task_id++),
            );
        }
        asyncPool(funcs, 5).then(() => {
            logs.innerHTML += `<h3>All tasks completed. Refreshing homeworks...</h3>`;
            logs.scrollTop = logs.scrollHeight;
            progress_bar.style.width = "100%"; // Set final progress bar to 100%
            this.display_hwks();
        });
    }

    async get_display_translations() {
        this.display_translations = await this.call_lnut(
            "publicTranslationController/getTranslations",
            {},
        );
        this.display_translations = this.display_translations.translations;
    }

    async get_module_translations() {
        this.module_translations = await this.call_lnut(
            "translationController/getUserModuleTranslations",
            {
                token: this.token,
            },
        );
        this.module_translations = this.module_translations.translations;
    }

    async get_hwks() {
        const homeworks = await this.call_lnut(
            "assignmentController/getViewableAll",
            {
                token: this.token,
            },
        );
        return homeworks;
    }
}

app = new client_application();
app.main();
