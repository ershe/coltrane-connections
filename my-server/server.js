// my-server/server.js
const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database file
const db = new Database("coltrane.db");

// Enforce foreign key constraints in SQLite
db.pragma("foreign_keys = ON");

// Initialize database tables on server start
db.exec(`
  CREATE TABLE IF NOT EXISTS musicians (
    id INTEGER PRIMARY KEY,
    discogs_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    primary_instrument TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    session_date TEXT,
    location TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY,
    discogs_release_id INTEGER UNIQUE,
    discogs_master_id INTEGER,
    title TEXT NOT NULL,
    release_year INTEGER,
    label TEXT,
    catalog_number TEXT,
    is_leader INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY,
    album_id INTEGER,
    session_id INTEGER,
    title TEXT NOT NULL,
    track_number INTEGER,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS session_musicians (
    session_id INTEGER NOT NULL,
    musician_id INTEGER NOT NULL,
    instrument TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Sideman',
    PRIMARY KEY (session_id, musician_id, instrument),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (musician_id) REFERENCES musicians(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`);

// --- API ENDPOINTS FOR REACT ---

// Users endpoints
app.get("/api/users", (req, res) => {
  try {
    const users = db.prepare("SELECT * FROM users ORDER BY id ASC").all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/users", (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    const info = db.prepare("INSERT INTO users (name) VALUES (?)").run(name.trim());
    const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch all albums chronologically
app.get("/api/albums", (req, res) => {
  try {
    const albums = db
      .prepare("SELECT * FROM albums ORDER BY release_year ASC")
      .all();
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch album details with tracks and session dates
app.get("/api/albums/:id", (req, res) => {
  try {
    const album = db
      .prepare("SELECT * FROM albums WHERE id = ?")
      .get(req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });

    const tracks = db
      .prepare(
        `
      SELECT t.*, s.session_date, s.location 
      FROM tracks t
      LEFT JOIN sessions s ON t.session_id = s.id
      WHERE t.album_id = ?
      ORDER BY t.track_number ASC
    `,
      )
      .all(req.params.id);

    res.json({ ...album, tracks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch complete network graph data (musicians + session relationships)
app.get("/api/network", (req, res) => {
  try {
    const musicians = db
      .prepare("SELECT id, name, primary_instrument FROM musicians")
      .all();
    const relationships = db
      .prepare(
        `
      SELECT 
        sm.session_id,
        sm.musician_id,
        sm.instrument,
        sm.role,
        s.session_date
      FROM session_musicians sm
      JOIN sessions s ON sm.session_id = s.id
      ORDER BY s.session_date ASC
    `,
      )
      .all();

    res.json({ musicians, relationships });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/timeline", (req, res) => {
  try {
    // Extract the YYYY from the ISO session_date string (e.g. '1959-05-04')
    const rows = db
      .prepare(
        `
      SELECT DISTINCT
        CAST(SUBSTR(s.session_date, 1, 4) AS INTEGER) AS recording_year,
        m.id AS musician_id,
        m.name AS musician_name,
        a.id AS album_id,
        a.title AS album_title,
        sm.instrument
      FROM sessions s
      JOIN tracks t ON s.id = t.session_id
      JOIN albums a ON t.album_id = a.id
      JOIN session_musicians sm ON s.id = sm.session_id
      JOIN musicians m ON sm.musician_id = m.id
      WHERE s.session_date IS NOT NULL
        AND m.discogs_id != 97545 -- Exclude Coltrane
      ORDER BY recording_year ASC, m.name ASC, a.title ASC
    `,
      )
      .all();

    const timeline = [];
    let currentYear = null;
    let yearObj = null;

    rows.forEach((row) => {
      // 1. Group by the actual Recording Year
      if (row.recording_year !== currentYear) {
        currentYear = row.recording_year;
        yearObj = { year: currentYear, musicians: [] };
        timeline.push(yearObj);
      }

      // 2. Group by Musician
      let musObj = yearObj.musicians.find((m) => m.id === row.musician_id);
      if (!musObj) {
        musObj = { id: row.musician_id, name: row.musician_name, albums: [] };
        yearObj.musicians.push(musObj);
      }

      // 3. Attach Albums/Sessions
      if (!musObj.albums.find((a) => a.id === row.album_id)) {
        musObj.albums.push({
          id: row.album_id,
          title: row.album_title,
          instrument: row.instrument,
        });
      }
    });

    // Filter out any anomalous years outside his lifetime/active career (e.g., bad data)
    const filteredTimeline = timeline.filter(
      (t) => t.year >= 1946 && t.year <= 1967,
    );

    res.json(filteredTimeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Coltrane Archive API running on http://localhost:${PORT}`);
});
