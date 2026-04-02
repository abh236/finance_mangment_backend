const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDb, writeDb, nextId } = require("../db/store");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

async function registerUser({ name, email, password, role }) {
  const db = await readDb();
  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) throw new HttpError(409, "Email already exists");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: nextId(db.users),
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await writeDb(db);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

async function loginUser({ email, password }) {
  const db = await readDb();
  const user = db.users.find((u) => u.email === email.toLowerCase());
  if (!user) throw new HttpError(401, "Invalid credentials");
  if (!user.isActive) throw new HttpError(403, "User is inactive");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Invalid credentials");

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  return { token };
}

async function listUsers() {
  const db = await readDb();
  return db.users.map(({ passwordHash, ...user }) => user);
}

async function updateUser(userId, changes) {
  const db = await readDb();
  const index = db.users.findIndex((u) => u.id === userId);
  if (index === -1) throw new HttpError(404, "User not found");

  db.users[index] = { ...db.users[index], ...changes };
  await writeDb(db);

  const { passwordHash, ...user } = db.users[index];
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  listUsers,
  updateUser,
};
