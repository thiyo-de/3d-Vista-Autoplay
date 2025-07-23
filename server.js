const express = require("express");
const fs = require("fs");
const path = require("path");
const prettier = require("prettier");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/public", express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json());

let ROOT = null;
let MAIN, BACKUP, MODIFIED, INDEX;

// 🧠 Autopilot JS block
function generateAutopilotBlock(speed) {
  return `enterPointingToHorizon: true,
initialPosition: { yaw: 0, class: "PanoramaCameraPosition", pitch: 0 },
initialSequence: {
  mandatory: true,
  movements: [
    {
      targetYaw: 359,
      targetPitch: 0,
      path: "longest",
      duration: ${speed},
      easing: "cubic_in_out",
      class: "TargetPanoramaCameraMovement"
    }
  ],
  class: "PanoramaCameraSequence"
}`;
}

// ✨ Prettify JS using Prettier
async function prettify(code) {
  try {
    return await prettier.format(code, { parser: "babel" });
  } catch (err) {
    console.warn("⚠️ Prettier failed:", err.message);
    return code;
  }
}

// 🔄 Set paths after folder input
function setPaths(folderPath) {
  ROOT = folderPath;
  MAIN = path.join(ROOT, "script_general.js");
  BACKUP = path.join(ROOT, "backup_script_general.js");
  MODIFIED = path.join(ROOT, "modified_script_general.js");
  INDEX = path.join(ROOT, "index.htm");
}

// 🧠 Inject autopilot into script and remove existing initialPosition
function injectAutopilot(rawCode, speed = 4000) {
  const cleanedCode = rawCode.replace(/initialPosition\s*:\s*\{[^}]+\},?/g, "");
  const regex = /(initialSequence\s*:\s*)"this\.sequence_[A-Z0-9_]+?"/g;
  const matches = [...cleanedCode.matchAll(regex)];
  const autopilotBlock = generateAutopilotBlock(speed); // ✅ use speed
  const modifiedCode = cleanedCode.replace(regex, autopilotBlock);

  return { modifiedCode, count: matches.length };
}

// 🧹 Remove base64 inline PNGs
function removeInlinePNGs(directory) {
  const extensions = [".js", ".html", ".htm", ".json"];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.includes(path.extname(entry.name))) {
        let content = fs.readFileSync(fullPath, "utf-8");
        const cleaned = content.replace(
          /data:image\/png;base64,[^'"\s)]+/g,
          "null"
        );
        if (cleaned !== content) {
          fs.writeFileSync(fullPath, cleaned, "utf-8");
          console.log("🧹 Cleaned:", fullPath);
        }
      }
    }
  };
  try {
    walk(directory);
    console.log("✅ Base64 PNGs cleaned in:", directory);
  } catch (err) {
    console.error("❌ Failed to clean inline PNGs:", err.message);
  }
}

// 🧩 Inject UI buttons into index.htm
function patchIndexFile() {
  const html = fs.readFileSync(INDEX, "utf-8");

  // ✅ Avoid duplicate injection
  const alreadyHasUI = html.includes('id="turbo-mode-controls"');
  if (alreadyHasUI) {
    console.log("✅ Autopilot controls already present in index.htm");
    return;
  }

  // ✅ Controls HTML to inject
  const controlsHTML = `<!-- AUTOPILOT-CONTROLS-BEGIN -->
<link href="https://fonts.bunny.net/css?family=satoshi:400,500,700" rel="stylesheet" />

<div id="turbo-mode-controls">
  <div class="turbo-wrapper">
    <div id="turbo-tooltip">Loading tooltip...</div>
    <button id="turbo-btn">Loading...</button>
  </div>
</div>

<script>
  var devicesUrl = { general: "script_general.js" };

  async function enableAutopilot() {
    await fetch("/enable-autopilot", { method: "POST" });
    localStorage.setItem("autopilotEnabled", "true");
    devicesUrl.general = "modified_script_general.js?v=" + Date.now();
    window.location.reload();
  }

  async function disableAutopilot() {
    await fetch("/disable-autopilot", { method: "POST" });
    localStorage.setItem("autopilotEnabled", "false");
    devicesUrl.general = "script_general.js?v=" + Date.now();
    window.location.reload();
  }

  function updateTurboButton(isOn) {
    const btn = document.getElementById("turbo-btn");
    const tooltip = document.getElementById("turbo-tooltip");

    if (isOn) {
      btn.textContent = "⚡ Turbo Mode : ON";
      tooltip.textContent = "Turbo mode is currently ON. Click to turn it OFF.";
      btn.onclick = disableAutopilot;
      btn.classList.add("off");
      btn.classList.remove("on");
    } else {
      btn.textContent = "⛔ Turbo Mode : OFF";
      tooltip.textContent = "Turbo mode is currently OFF. Click to turn it ON.";
      btn.onclick = enableAutopilot;
      btn.classList.add("on");
      btn.classList.remove("off");
    }
  }

  (function init() {
    const mode = localStorage.getItem("autopilotEnabled") === "true";
    devicesUrl.general = (mode ? "modified_script_general.js" : "script_general.js") + "?v=" + Date.now();
    updateTurboButton(mode);
  })();
</script>

<style>
  #turbo-mode-controls {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 999;
    font-family: "Satoshi", sans-serif;
  }

  .turbo-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    position: relative;
  }

  #turbo-btn {
    padding: 12px 18px;
    font-size: 15px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    color: white;
    font-family: "Satoshi", sans-serif;
  }

  #turbo-btn.off {
    background: linear-gradient(to right, #2563eb, #3b82f6);
  }

  #turbo-btn.on {
    background: linear-gradient(to right, #b91c1c, #dc2626);
  }

  #turbo-btn:hover {
    opacity: 0.95;
    transform: scale(1.02);
  }

  #turbo-tooltip {
    position: absolute;
    bottom: 100%;
    left: 0;
    background-color: #1e293b;
    color: #fff;
    font-size: 13px;
    font-weight: 400;
    padding: 8px 12px;
    border-radius: 6px;
    max-width: 240px;
    line-height: 1.4;
    margin-bottom: 8px;
    font-family: "Satoshi", sans-serif;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  #turbo-tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 15px;
    margin-left: -5px;
    border-width: 6px;
    border-style: solid;
    border-color: #1e293b transparent transparent transparent;
  }
</style>
<!-- AUTOPILOT-CONTROLS-END -->`;

  // ✅ Inject before </body>
  const updated = html.replace("</body>", `${controlsHTML}\n</body>`);
  fs.writeFileSync(INDEX, updated, "utf-8");
  console.log("✅ Autopilot UI injected into index.htm");
}

// 📦 Create backup, autopilot file, clean PNGs, inject UI
async function initializeFiles(speed = 4000) {
  patchIndexFile();
  removeInlinePNGs(ROOT);

  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(MAIN, BACKUP);
    console.log("📦 Backup created.");
  }

  const raw = fs.readFileSync(MAIN, "utf-8");
  const pretty = await prettify(raw);
  const { modifiedCode, count } = injectAutopilot(pretty, speed); // ✅ pass speed
  const final = await prettify(modifiedCode);
  fs.writeFileSync(MODIFIED, final, "utf-8");
  console.log(`✅ Autopilot version created (${count} panoramas updated).`);
}

// 🎯 Receive folder path
app.post("/set-path", async (req, res) => {
  const folderPath = req.body.path;
  const speed = parseInt(req.body.speed) || 4000; // ✅ extract speed

  if (!folderPath)
    return res
      .status(400)
      .json({ success: false, message: "No path provided." });

  if (!fs.existsSync(folderPath))
    return res
      .status(400)
      .json({ success: false, message: "Folder not found." });

  if (!fs.existsSync(path.join(folderPath, "script_general.js")))
    return res
      .status(400)
      .json({ success: false, message: "Missing script_general.js" });

  try {
    setPaths(folderPath);
    await initializeFiles(speed); // ✅ pass speed
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error during set-path:", err);
    res.status(500).json({ success: false, message: "Internal error." });
  }
});

// ▶️ Enable autopilot
app.post("/enable-autopilot", (req, res) => {
  try {
    fs.copyFileSync(MODIFIED, MAIN);
    console.log("🔁 Autopilot enabled.");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Enable failed." });
  }
});

// ⏹️ Disable autopilot
app.post("/disable-autopilot", (req, res) => {
  try {
    fs.copyFileSync(BACKUP, MAIN);
    console.log("🔁 Autopilot disabled.");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Disable failed." });
  }
});

// Serve default UI (to submit path)
app.get("/", (req, res) => {
  res.redirect("/public/UI.html");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log("📭 Awaiting user to submit their folder path via UI.");
});
