const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.daily-quote-widget');
const DATA_FILE = path.join(DATA_DIR, 'quote-data.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const QUOTES = [
  { text: "The present moment always will have been.", author: "Unknown" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", author: "Robert Louis Stevenson" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "An unexamined life is not worth living.", author: "Socrates" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche" },
  { text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw" },
  { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
  { text: "No act of kindness, no matter how small, is ever wasted.", author: "Aesop" },
  { text: "Go confidently in the direction of your dreams!", author: "Henry David Thoreau" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "Whoever is happy will make others happy too.", author: "Anne Frank" },
  { text: "We become what we think about.", author: "Earl Nightingale" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Perfection is not attainable, but if we chase perfection we can catch excellence.", author: "Vince Lombardi" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "Darkness cannot drive out darkness; only light can do that.", author: "Martin Luther King Jr." },
  { text: "Life is not measured by the number of breaths we take, but by the moments that take our breath away.", author: "Maya Angelou" }
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function loadData() {
  try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE,'utf8')); } catch(e) {}
  return {};
}

function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8'); }

function getFallbackQuote() {
  const index = parseInt(getTodayKey().replace(/-/g,'')) % QUOTES.length;
  return QUOTES[index];
}

async function fetchFromZenQuotes() {
  const https = require('https');
  return new Promise((resolve, reject) => {
    const url = 'https://zenquotes.io/api/today';
    https.get(url, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const q = Array.isArray(data) ? data[0] : data;
          if (q && q.q && q.a) {
            resolve({ text: q.q, author: q.a });
          } else {
            reject(new Error('Unexpected API response shape'));
          }
        } catch(e) { reject(e); }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Request timed out')));
  });
}

async function getDailyQuote() {
  const todayKey = getTodayKey();
  const data = loadData();

  // Return cached quote if we already fetched today
  if (data.date === todayKey && data.quote) return data.quote;

  try {
    const quote = await fetchFromZenQuotes();
    saveData({ date: todayKey, quote, source: 'zenquotes', lastUpdated: new Date().toISOString() });
    return quote;
  } catch (err) {
    console.warn('ZenQuotes API unavailable, using fallback:', err.message);
    const quote = getFallbackQuote();
    saveData({ date: todayKey, quote, source: 'fallback', lastUpdated: new Date().toISOString() });
    return quote;
  }
}

let mainWindow = null;
let tray = null;

function createWindow() {
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize;
  const W = 360, H = 220, MARGIN = 20;

  mainWindow = new BrowserWindow({
    width: W, height: H,
    x: screenW - W - MARGIN, y: MARGIN,
    frame: false, transparent: true, alwaysOnTop: false,
    resizable: false, skipTaskbar: true, hasShadow: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    type: 'desktop', fullscreenable: false
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="#C94070"/><text x="8" y="12" text-anchor="middle" font-size="11" fill="white" font-family="Georgia,serif">"</text></svg>`;
  const icon = nativeImage.createFromDataURL(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Daily Quote Widget');

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show / Hide', click: () => mainWindow && (mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()) },
    { type: 'separator' },
    { label: 'Preview Random Quote', click: () => mainWindow && mainWindow.webContents.send('quote-update', QUOTES[Math.floor(Math.random()*QUOTES.length)]) },
    { label: "Reset to Today's Quote", click: async () => mainWindow && mainWindow.webContents.send('quote-update', await getDailyQuote()) },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' }
  ]));

  tray.on('click', () => mainWindow && (mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()));
}

ipcMain.handle('get-quote', () => getDailyQuote()); // already returns a Promise
ipcMain.on('close-widget', () => mainWindow && mainWindow.hide());
ipcMain.on('set-position', (_, { x, y }) => mainWindow && mainWindow.setPosition(Math.round(x), Math.round(y)));

function scheduleMidnightRefresh() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  setTimeout(async () => {
    if (mainWindow) mainWindow.webContents.send('quote-update', await getDailyQuote());
    scheduleMidnightRefresh();
  }, midnight - now);
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  scheduleMidnightRefresh();
  app.on('activate', () => { if (!mainWindow) createWindow(); });
});

app.on('window-all-closed', e => e.preventDefault());