// api/history/delete.js

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

    const { word } = req.body;

    const connection = await connectToDatabase();

    const [result] = await connection.execute(
      "DELETE FROM search_history WHERE user_id = ? AND word = ?",
      [userId, word]
    );

    await connection.end();

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "History item deleted successfully." });
    } else {
      res
        .status(404)
        .json({ message: "History item not found or not deleted." });
    }
  } catch (error) {
    console.error("Delete history error:", error);
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
