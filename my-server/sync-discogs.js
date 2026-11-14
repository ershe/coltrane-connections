require("dotenv").config();
const Database = require("better-sqlite3");

const db = new Database("coltrane.db");
db.pragma("foreign_keys = ON");

const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN;
const COLTRANE_ARTIST_ID = 97545;
const USER_AGENT = "ColtraneArchiveApp/4.0 (+http://localhost:3000)";

if (!DISCOGS_TOKEN) {
  console.error("Error: DISCOGS_TOKEN missing in environment variables.");
  process.exit(1);
}

// 60 requests/min = ~1050ms delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchDiscogs(endpoint) {
  await delay(1050);
  const response = await fetch(`https://api.discogs.com${endpoint}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Authorization: `Discogs token=${DISCOGS_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Discogs API HTTP Error: ${response.status} ${response.statusText}`,
    );
  }
  return response.json();
}

// Check if a credit role is a musical performance vs behind-the-scenes
const nonPerformingRoles = [
  "written",
  "writer",
  "compose",
  "arrange",
  "produce",
  "engineer",
  "master",
  "mix",
  "record",
  "design",
  "art",
  "artwork",
  "photo",
  "liner",
  "sleeve",
  "compile",
  "coordinator",
  "executive",
  "presenter",
  "text",
  "typography",
  "layout",
];

function isPerformingRole(role) {
  if (!role) return true; // Main artists often don't have a specific role listed
  const r = role.toLowerCase();
  return !nonPerformingRoles.some((np) => r.includes(np));
}

const statements = {
  upsertMusician: db.prepare(`
    INSERT INTO musicians (discogs_id, name, primary_instrument)
    VALUES (?, ?, ?)
    ON CONFLICT(discogs_id) DO UPDATE SET
      name = excluded.name,
      primary_instrument = COALESCE(excluded.primary_instrument, musicians.primary_instrument)
    RETURNING id;
  `),
  upsertSession: db.prepare(`
    INSERT INTO sessions (session_date, location, notes)
    VALUES (?, ?, ?)
    RETURNING id;
  `),
  upsertAlbum: db.prepare(`
    INSERT INTO albums (discogs_release_id, discogs_master_id, title, release_year, label, catalog_number, is_leader)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(discogs_release_id) DO UPDATE SET
      title = excluded.title,
      release_year = excluded.release_year,
      label = excluded.label
    RETURNING id;
  `),
  insertTrack: db.prepare(`
    INSERT INTO tracks (album_id, session_id, title, track_number)
    VALUES (?, ?, ?, ?);
  `),
  upsertSessionMusician: db.prepare(`
    INSERT INTO session_musicians (session_id, musician_id, instrument, role)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(session_id, musician_id, instrument) DO UPDATE SET
      role = excluded.role;
  `),
};

async function syncColtraneDiscography() {
  console.log("--- Starting Strict Discogs Sync for John Coltrane ---");

  const processedMasterIds = new Set();
  const processedReleaseIds = new Set();

  let page = 1;
  let totalPages = 1;

  do {
    console.log(`\nFetching page ${page} of releases...`);
    const releaseListData = await fetchDiscogs(
      `/artists/${COLTRANE_ARTIST_ID}/releases?per_page=50&page=${page}`,
    );
    totalPages = releaseListData.pagination.pages;

    for (const item of releaseListData.releases) {
      if (
        item.role !== "Main" &&
        item.role !== "Appearance" &&
        item.role !== "TrackAppearance"
      ) {
        continue;
      }

      const formatString = (item.format || "").toLowerCase();
      const titleString = (item.title || "").toLowerCase();

      // Filter out compilations, promos, and video formats (DVD, Blu-ray, VHS) at the high level
      const isCompilation =
        formatString.includes("compilation") ||
        titleString.includes("greatest hits") ||
        titleString.includes("best of") ||
        titleString.includes("anthology");
      const isRemix =
        formatString.includes("remix") || titleString.includes("remix");
      const isUnofficial =
        formatString.includes("unofficial") || formatString.includes("promo");
      const isVideo =
        formatString.includes("dvd") ||
        formatString.includes("video") ||
        formatString.includes("blu-ray") ||
        formatString.includes("vhs");

      if (isCompilation || isRemix || isUnofficial || isVideo) {
        console.log(`- Skipping Non-Original/Video: "${item.title}"`);
        continue;
      }

      let targetReleaseId;
      let masterId = null;

      if (item.type === "master") {
        masterId = item.id;
        if (processedMasterIds.has(masterId)) continue;
        processedMasterIds.add(masterId);
        targetReleaseId = item.main_release;
      } else if (item.type === "release") {
        if (processedReleaseIds.has(item.id)) continue;
        processedReleaseIds.add(item.id);
        targetReleaseId = item.id;
      } else {
        continue;
      }

      try {
        console.log(
          `\nProcessing Original: "${item.title}" [Release ID: ${targetReleaseId}]`,
        );
        const releaseDetail = await fetchDiscogs(
          `/releases/${targetReleaseId}`,
        );

        const formatDescriptions = (releaseDetail.formats || [])
          .flatMap((f) => f.descriptions || [])
          .map((d) => d.toLowerCase());

        // 1. Check for Box Sets, Singles, EPs, and lingering compilations/video
        if (
          formatDescriptions.includes("box set") ||
          formatDescriptions.includes("single") ||
          formatDescriptions.includes("ep") ||
          formatDescriptions.includes('7"') ||
          formatDescriptions.includes("45 rpm") ||
          formatDescriptions.includes("compilation") ||
          formatDescriptions.includes("unofficial") ||
          formatDescriptions.includes("dvd-video") ||
          formatDescriptions.includes("video")
        ) {
          console.log(
            `- Secondary Skip (Format detail): "${releaseDetail.title}"`,
          );
          continue;
        }

        // 2. Check for Non-Music / Interviews / Spoken Word
        const genres = (releaseDetail.genres || []).map((g) => g.toLowerCase());
        const styles = (releaseDetail.styles || []).map((s) => s.toLowerCase());

        if (
          genres.includes("non-music") ||
          styles.includes("interview") ||
          styles.includes("spoken word")
        ) {
          console.log(
            `- Skipping Non-Music / Interview: "${releaseDetail.title}"`,
          );
          continue;
        }

        // 3. Check for "Various Artists" Samplers
        const isVariousArtists = (releaseDetail.artists || []).some(
          (a) => a.name === "Various" || a.name === "Various Artists",
        );
        if (isVariousArtists) {
          console.log(
            `- Skipping Various Artists Sampler: "${releaseDetail.title}"`,
          );
          continue;
        }

        // Gather all personnel across the album and specific tracks
        const rawPersonnel = [
          ...(releaseDetail.artists || []),
          ...(releaseDetail.extraartists || []),
        ];
        (releaseDetail.tracklist || []).forEach((t) => {
          if (t.extraartists) rawPersonnel.push(...t.extraartists);
        });

        // Deduplicate and filter performing roles
        const validPerformers = new Map();
        let coltranePerformed = false;

        for (const member of rawPersonnel) {
          if (!member.id || !member.name) continue;

          const rawRole = member.role || "Performer";

          // Skip writers, producers, engineers, etc.
          if (!isPerformingRole(rawRole)) continue;

          let cleanRole = rawRole.split("[")[0].trim();

          // Ensure Coltrane receives a valid instrument tag if blank/generic
          if (member.id === COLTRANE_ARTIST_ID) {
            coltranePerformed = true;
            if (cleanRole === "Performer" || cleanRole === "") {
              cleanRole = "Saxophone";
            }
          }

          const uniqueKey = `${member.id}-${cleanRole}`;
          if (!validPerformers.has(uniqueKey)) {
            validPerformers.set(uniqueKey, {
              id: member.id,
              name: member.name,
              role: cleanRole,
              isLeader: (releaseDetail.artists || []).some(
                (a) => a.id === member.id,
              ),
            });
          }
        }

        // If Coltrane was only a writer on this release, skip inserting the album entirely
        if (!coltranePerformed) {
          console.log(
            `- Skipping: Coltrane did not perform (likely a writing/composition credit only): "${releaseDetail.title}"`,
          );
          continue;
        }

        const isLeader = item.role === "Main" ? 1 : 0;
        const labelName = releaseDetail.labels?.[0]?.name || "Unknown Label";
        const catNo = releaseDetail.labels?.[0]?.catno || null;
        const releaseYear = releaseDetail.year || item.year || null;

        const syncTransaction = db.transaction(() => {
          // Save Album
          const albumRecord = statements.upsertAlbum.get(
            releaseDetail.id,
            masterId,
            releaseDetail.title,
            releaseYear,
            labelName,
            catNo,
            isLeader,
          );

          // Create Recording Session
          const sessionRecord = statements.upsertSession.get(
            releaseYear ? `${releaseYear}-01-01` : null,
            releaseDetail.country || "Studio/Live Venue",
            releaseDetail.notes || null,
          );

          // Save Valid Performing Bandmates
          for (const performer of validPerformers.values()) {
            const musicianRecord = statements.upsertMusician.get(
              performer.id,
              performer.name,
              performer.role,
            );

            const sessionRole = performer.isLeader
              ? performer.id === COLTRANE_ARTIST_ID
                ? "Leader"
                : "Co-Leader"
              : "Sideman";

            statements.upsertSessionMusician.run(
              sessionRecord.id,
              musicianRecord.id,
              performer.role,
              sessionRole,
            );
          }

          // Save Tracklist
          (releaseDetail.tracklist || []).forEach((track, index) => {
            if (track.title) {
              statements.insertTrack.run(
                albumRecord.id,
                sessionRecord.id,
                track.title,
                index + 1,
              );
            }
          });
        });

        syncTransaction();
        console.log(
          `✓ Inserted: "${releaseDetail.title}" (${releaseYear}) with ${validPerformers.size} performing musicians.`,
        );
      } catch (err) {
        console.error(
          `✕ Error syncing release ID ${targetReleaseId}:`,
          err.message,
        );
      }
    }
    page++;
  } while (page <= totalPages);

  console.log("\n=========================================");
  console.log("✓ Strict official discography sync complete!");
  console.log("=========================================");
}

syncColtraneDiscography().catch((err) => {
  console.error("Fatal Sync Error:", err);
});
