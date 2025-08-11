// api/auth/signup.js

import { connectToDatabase } from "../utils/db.js";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await connectToDatabase();

    const [result] = await connection.execute(
      "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    await connection.end();

    if (result.affectedRows > 0) {
      res.status(201).json({ message: "User created successfully." });
    } else {
      res.status(500).json({ message: "Failed to create user." });
    }
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists." });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
