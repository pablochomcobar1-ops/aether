import bcrypt from "bcryptjs";
import { connectDB } from "./db.js";
import User from "../models/User.js";

export { SESSION_COOKIE, SESSION_MAX_AGE, signSession, readSession } from "./token.js";

const BCRYPT_COST = 12;

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

let dummyHash;
const findUserByEmail = async (email) => {
  await connectDB();
  return User.findOne({ email }).select("+passwordHash");
};

export async function checkLogin(email, password, findUser = findUserByEmail) {
  const user = await findUser(email);
  if (!user) {
    dummyHash ??= await bcrypt.hash("aether-timing-guard", BCRYPT_COST);
    await bcrypt.compare(password, dummyHash);
    return null;
  }
  return (await bcrypt.compare(password, user.passwordHash)) ? user : null;
}

const loadRoleFromDB = async (userId) => {
  await connectDB();
  const user = await User.findById(userId).select("role").lean().catch(() => null);
  return user?.role ?? null;
};

export async function authorizeAdmin(session, loadRole = loadRoleFromDB) {
  if (!session?.userId) return false;
  return (await loadRole(session.userId)) === "admin";
}
