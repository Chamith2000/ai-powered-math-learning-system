export const STUDENT_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export const setStudentSession = (token, userId, difficultyLevel) => {
  const expiresAt = Date.now() + STUDENT_SESSION_DURATION_MS;
  localStorage.setItem("token", token);
  localStorage.setItem("expiresAt", expiresAt.toString());
  localStorage.setItem("userId", userId);
  localStorage.setItem("difficultyLevel", difficultyLevel ?? "Easy");
};

export const clearStudentSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("expiresAt");
  localStorage.removeItem("userId");
  localStorage.removeItem("difficultyLevel");
};

export const hasValidStudentSession = () => {
  const token = localStorage.getItem("token");
  const expiresAt = localStorage.getItem("expiresAt");

  if (!token || !expiresAt) {
    return false;
  }

  if (Date.now() > Number(expiresAt)) {
    clearStudentSession();
    return false;
  }

  return true;
};

export const getStudentSessionRemainingMs = () => {
  const expiresAt = localStorage.getItem("expiresAt");

  if (!expiresAt) {
    return 0;
  }

  return Math.max(Number(expiresAt) - Date.now(), 0);
};
