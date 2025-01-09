import bcrypt from "bcrypt";

const saltRounds = 14;

async function hash(password) {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

async function compare(password, hash) {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
}

export { hash, compare };
