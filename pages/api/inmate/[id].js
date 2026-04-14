import { parseGoogleBook } from "../../../lib/helpers.js";

const GOOGLE_BASE = "https://www.googleapis.com/books/v1/volumes";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");

  try {
    const response = await fetch(`${GOOGLE_BASE}/${encodeURIComponent(id)}`);
    if (!response.ok) {
      return res.status(404).json({ error: "Inmate not found" });
    }
    const vol  = await response.json();
    const book = parseGoogleBook(vol);
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
