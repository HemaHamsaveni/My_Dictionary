// api/history/get.js

import { connectToDatabase } from "../utils/db.js";
import jwt from "jsonwebtoken";

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

    const connection = await connectToDatabase();

    const [rows] = await connection.execute(
      // Corrected SQL query:
      // This groups by the unique word and finds the latest search time for each.
      // It then orders the entire list based on those latest timestamps.
      "SELECT word, MAX(searched_at) AS last_searched FROM search_history WHERE user_id = ? GROUP BY word ORDER BY last_searched DESC",
      [userId]
    );

    await connection.end();

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get history error:", error);
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
