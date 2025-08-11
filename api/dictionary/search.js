// api/dictionary/search.js

import { connectToDatabase } from "../utils/db.js";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authorization token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { word } = req.query;
    const apiURL = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

    const response = await fetch(apiURL);
    if (!response.ok) {
      return res.status(404).json({ message: "Word not found." });
    }
    const dictionaryData = await response.json();

    const connection = await connectToDatabase();

    // Save the search to the history table
    await connection.execute(
      "INSERT INTO search_history (user_id, word) VALUES (?, ?)",
      [userId, word]
    );

    await connection.end();

    res.status(200).json(dictionaryData);
  } catch (error) {
    console.error("Search error:", error);
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
