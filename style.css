@import url('https://fonts.googleapis.com/css2?family=Space+Mono&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Comic+Neue&display=swap');

/* ------------------------------------- */
/* --- GLOBAL BODY & FONT --- */
/* ------------------------------------- */

body {
    font-family: "Comic Sans MS", "Comic Sans", "Comic Neue", cursive;
    font-weight: 700;
    font-size: 1.05rem;
    background-image: url("./hellfire.gif"); 
    background-repeat: no-repeat;
    background-size: cover; 
    background-attachment: fixed;
    min-height: 100vh;
    color: white; 
    margin: 0; 
    padding: 0;
}

button {
    font-family: inherit;
    cursor: pointer;
}

img[src*="languagenut"] {
    display: block;
    margin: 50px auto 20px auto;
}

/* ------------------------------------- */
/* --- LOADING & ANIMATION STYLES --- */
/* ------------------------------------- */

@keyframes pulsate {
    0% { box-shadow: 0 0 5px #00FF00, 0 0 10px #00FF00; }
    100% { box-shadow: 0 0 15px #00FF00, 0 0 20px rgba(0, 255, 0, 0.5); }
}

@keyframes loading {
    0%{ transform: translateX(0); }
    25%{ transform: translateX(15px); }
    50%{ transform: translateX(-15px); }
    75%{ transform: translateX(15px); }
    100%{ transform: translateX(0); }
}

#loading_screen {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.95);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: #00FF00;
    font-size: 1.5rem;
    transition: opacity 0.5s ease-out, visibility 0s linear 0.5s;
}

#loading_screen.hidden {
    opacity: 0; visibility: hidden; pointer-events: none;
}

.loader { display: flex; align-items: center; margin-bottom: 20px; }
.loader span { height: 25px; width: 25px; margin-right: 10px; border-radius: 50%; background-color: #00FF00; animation: loading 1.5s linear infinite; }
.loader span:nth-child(1) { animation-delay: 0.1s; }
.loader span:nth-child(2) { animation-delay: 0.2s; }
.loader span:nth-child(3) { animation-delay: 0.3s; }

/* ------------------------------------- */
/* --- PANEL BASE STYLES (FLEXBOX) --- */
/* ------------------------------------- */

.overlay {
    position: absolute;
    border-radius: 1rem;
    padding: 1.5rem;
    width: 45%; 
    background-color: rgba(0, 0, 0, 0.9); 
    height: 650px; /* FIXED HEIGHT FOR FLEX CALCULATION */
    z-index: 10;
    border: 1px solid #00FF00; 
    
    /* CRITICAL FLEXBOX FIX */
    display: flex;
    flex-direction: column;
    box-sizing: border-box; 
    
    opacity: 0; 
    visibility: hidden; 
    transition: opacity 0.5s ease-out, transform 0.5s ease-out, visibility 0s linear 0.5s;
}

.overlay.visible {
    opacity: 1; 
    visibility: visible;
    transition: opacity 0.5s ease-out, transform 0.5s ease-out, visibility 0s linear;
}

#hw_panel { left: 1%; top: 180px; transform: translateX(-100%); }
#hw_panel.visible { transform: translateX(0); }

#log_panel { right: 1%; top: 180px; transform: translateX(100%); }
#log_panel.visible { transform: translateX(0); }

#login {
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    width: 90%; max-width: 400px;
    height: auto;
    background-color: rgba(0, 0, 0, 0.95);
    border: 2px solid #00FF00;
}
#login.visible { opacity: 1; }

/* ------------------------------------- */
/* --- CONTENT & LIST STYLES --- */
/* ------------------------------------- */

h2 {
    text-align: center; color: #00FF00;
    text-shadow: 0 0 5px rgba(0, 255, 0, 0.8); margin-top: 0;
}

h4 {
    color: #00FF00 !important; 
    border-bottom: 1px solid rgba(0, 255, 0, 0.3);
    padding-bottom: 5px; margin-bottom: 5px; margin-top: 15px !important;
}

.overflow_container {
    overflow-y: auto;
    padding: 0.5rem; 
    border: 1px solid #00FF00; 
    border-radius: 0.5rem;
    background-color: rgba(0, 0, 0, 0.3);
    margin-top: 0.5rem;
    
    /* CRITICAL FLEXBOX FIX */
    flex-grow: 1; 
    max-height: unset; 
}

.task { display: block; padding: 0.2rem 0; }

.log-entry {
    margin: 5px 0; padding: 5px; 
    border-left: 3px solid #00FF00; font-size: 0.9rem;
    cursor: pointer; background-color: rgba(0, 0, 0, 0.4); 
    border-radius: 4px; transition: background-color 0.2s;
}

.log-entry.expanded { border-left: 3px solid #FFFF00; background-color: rgba(0, 0, 0, 0.7); }
.log-entry .json_small { display: none; }
.log-entry.expanded .json_small { display: block; }


/* ------------------------------------- */
/* --- CONTROL ELEMENTS --- */
/* ------------------------------------- */

.progress_bar_container {
    height: 1rem; background-color: #333333; 
    border-radius: 5px; overflow: hidden; margin: 10px 0; 
}

.progress_bar { 
    width: 0%; height: 100%;
    background-color: #00ff00;
    transition: width 0.6s ease-out; 
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.7); 
}

#do_hw {
    background-color: #00FF00; color: black; font-weight: 900;
    border: 3px solid #00CC00; border-radius: 8px;
    padding: 8px 15px; display: block; width: 100%;
    box-sizing: border-box;
    margin-top: 1rem; /* Space above button */
    margin-bottom: 0; /* Important: prevents overflow at the bottom */
    transition: background-color 0.2s, transform 0.2s;
}

.settings_button {
    position: fixed; top: 10px;
    padding: 0.75rem; background-color: rgba(0, 0, 0, 0.8);
    color: white; border: 2px solid #00FF00;
    border-radius: 8px; font-weight: 700; z-index: 30;
    animation: pulsate 1.5s infinite alternate; 
}

#settings_button { right: 10px; }
#logout_button { right: 120px; } /* Positioning for two buttons */

/* ------------------------------------- */
/* --- INPUTS & DIALOGS --- */
/* ------------------------------------- */

.login_field {
    display: block; width: 100%; margin-bottom: 15px;
    padding: 12px 15px; border: 1px solid #444; border-radius: 8px;
    font-size: 1rem; box-sizing: border-box; background-color: white; color: black;
}

#login_btn { background-color: lightgray; color: black; font-weight: 700; }

dialog#settings {
    background-color: rgba(0, 0, 0, 0.95); border: 2px solid #00FF00;
    border-radius: 1rem; padding: 2rem; color: white;
    max-width: 500px; width: 90%; z-index: 40;
}
