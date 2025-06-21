import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configurazione
const PORT = process.env.PORT || 8001;
const HOST = process.env.HOST || '0.0.0.0';
const WATCH_DIR = process.env.WATCH_DIR || '.';

// Middleware per parsing JSON e form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Funzione per iniettare il client live reload negli HTML
function injectLiveReload(html) {
  const liveReloadScript = `
<script src="/socket.io/socket.io.js"></script>
<script>
(function() {
  const socket = io();
  let isReloading = false;

  socket.on('reload', function() {
    if (isReloading) return;
    isReloading = true;
    console.log('🔄 File modificato, ricarico la pagina...');
    setTimeout(() => {
      location.reload();
    }, 100);
  });

  socket.on('connect', function() {
    // console.log('✅ Live reload connesso');
    isReloading = false;
  });

  socket.on('disconnect', function() {
    // console.log('❌ Live reload disconnesso');
  });

  // Reconnect automatico più veloce
  socket.on('reconnect', function() {
    // console.log('🔄 Live reload riconnesso');
    isReloading = false;
  });
})();
</script>`;

  // Inietta prima del tag </body> se esiste, altrimenti alla fine
  if (html.includes('</body>')) {
    return html.replace('</body>', liveReloadScript + '</body>');
  } else {
    return html + liveReloadScript;
  }
}

// Middleware per servire file statici con live reload
app.use((req, res, next) => {
  // Se la richiesta è per un file HTML, inietta il live reload
  if (req.path.endsWith('.html') || req.path === '/' ||
    (!path.extname(req.path) && !req.path.startsWith('/api'))) {

    let filePath;
    if (req.path === '/') {
      filePath = path.join(__dirname, 'index.html');
    } else if (!path.extname(req.path)) {
      filePath = path.join(__dirname, req.path + '.html');
    } else {
      filePath = path.join(__dirname, req.path);
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        if (req.path === '/' || !path.extname(req.path)) {
          // Prova senza .html se non trovato
          return next();
        }
        return res.status(404).send('<h1>404 - File Not Found</h1>');
      }

      const htmlWithLiveReload = injectLiveReload(data);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlWithLiveReload);
    });
  } else {
    next();
  }
});

// Serve file statici dalla directory corrente
app.use(express.static('.', {
  extensions: ['html', 'htm'],
  index: 'index.html'
}));

// Route per favicon (per evitare errori 404)
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No Content
});

// Route API come nel tuo esempio Python
app.post('/test.php', (req, res) => {
  const { username } = req.body;

  const responseData = {
    status: 'success',
    message: `Hello, ${username}!`,
    received_data: req.body
  };

  console.log(`Received POST request: username = ${username}`);
  res.json(responseData);
});

// Route per informazioni sul server
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    livereload: 'active',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO per live reload
io.on('connection', (socket) => {
  console.log('🔗 Client connesso per live reload');

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnesso dal live reload');
  });
});

// File watcher per live reload
const watcher = chokidar.watch(WATCH_DIR, {
  ignored: /node_modules|\.git|server\.js/,  // Ignora server.js per evitare restart
  persistent: true,
  ignoreInitial: true
});

let reloadTimeout;

watcher.on('change', (filePath) => {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);

  // Ignora il file del server per evitare restart
  if (fileName === 'server.js') {
    return;
  }

  if (['.html', '.css', '.js', '.json'].includes(ext)) {
    console.log(`📝 File modificato: ${filePath}`);

    // Debounce per evitare reload multipli
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      console.log('🔄 Invio reload ai client...');
      io.emit('reload');
    }, 200);
  }
});

watcher.on('add', (filePath) => {
  console.log(`File aggiunto: ${filePath}`);
});

watcher.on('unlink', (filePath) => {
  console.log(`File rimosso: ${filePath}`);
});

// Gestione errori
app.use((err, req, res, next) => {
  console.error('Errore:', err);
  res.status(500).send('Errore interno del server');
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).send('<h1>404 - Pagina Non Trovata</h1>');
});

// Avvio del server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Server in esecuzione su http://${HOST}:${PORT}/`);
  console.log(`📁 Directory monitorata: ${path.resolve(WATCH_DIR)}`);
  console.log(`🔄 Live reload attivo`);
  console.log(`📝 Monitora i file: .html, .css, .js, .json`);
  console.log(`⏹️  Premi Ctrl+C per fermare il server`);
});

// Gestione chiusura graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Chiusura del server...');
  watcher.close();
  server.close(() => {
    console.log('✅ Server chiuso correttamente');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM ricevuto, chiusura del server...');
  watcher.close();
  server.close(() => {
    console.log('✅ Server chiuso correttamente');
    process.exit(0);
  });
});
