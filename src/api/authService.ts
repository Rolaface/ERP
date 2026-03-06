const fakeUser = {
  email: "admin",
  password: "admin",
};

const AUTH_KEY = "auth_user";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const loginApi = async (email: string, password: string) => {
  await delay(500);

  if (email === fakeUser.email && password === fakeUser.password) {
    const user = { email };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  }

  throw new Error("Invalid credentials");
};

export const logoutApi = async () => {
  await delay(200);
  localStorage.removeItem(AUTH_KEY);
};

export const resetPasswordApi = async (email: string) => {
  await delay(500);

  if (email !== fakeUser.email) {
    throw new Error("User not found");
  }

  return { message: "Reset link sent (simulated)" };
};

export const getStoredUser = () => {
  const user = localStorage.getItem(AUTH_KEY);
  return user ? JSON.parse(user) : null;
};
