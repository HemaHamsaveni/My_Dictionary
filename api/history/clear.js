// api/history/clear.js

import { connectToDatabase } from "../utils/db.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
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

    // Delete all history for the user
    const [result] = await connection.execute(
      "DELETE FROM search_history WHERE user_id = ?",
      [userId]
    );

    await connection.end();

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "All history cleared successfully." });
    } else {
      res.status(200).json({ message: "No history to clear." });
    }
  } catch (error) {
    console.error("Clear history error:", error);
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
