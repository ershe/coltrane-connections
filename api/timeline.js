import fs from "fs";
import path from "path";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");

  try {
    const filePath = path.join(process.cwd(), "jazz-render", "public", "data", "timeline.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return res.status(200).json(data);
    }

    // Fallback if accessed inside nested directory
    const altPath = path.join(process.cwd(), "public", "data", "timeline.json");
    if (fs.existsSync(altPath)) {
      const data = JSON.parse(fs.readFileSync(altPath, "utf-8"));
      return res.status(200).json(data);
    }

    return res.status(404).json({ error: "timeline.json not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
