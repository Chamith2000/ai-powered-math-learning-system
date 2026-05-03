/**
 * studentTracker.js
 *
 * Computes all rolling and cumulative ML features from a sorted array of
 * raw session history documents.
 *
 * This is the single source of truth for building both:
 *   - /current-performance payload  (last 32 rows, 15 features each)
 *   - /future-forecast payload      (last 10+ rows, 17 named columns)
 *
 * Input (sessions): Array of StudentPerformanceHistory documents, sorted
 * chronologically (oldest first).
 *
 * Each session must have: sessionAt, sessionScore, timeSpent, waitTime,
 * resourceScore, difficulty.
 */

const WAIT_TIME_CAP = 55.9; // minutes — max wait time seen in training data

/**
 * Helper: slice the last N elements from sessions[0..i] inclusive.
 */
const lastN = (sessions, i, n) =>
  sessions.slice(Math.max(0, i - n + 1), i + 1);

const avgScore = (slice) =>
  slice.reduce((s, x) => s + (x.sessionScore || 0), 0) / slice.length;

const sumTime = (slice) =>
  slice.reduce((s, x) => s + (x.timeSpent || 0), 0);

const avgWait = (slice) =>
  slice.reduce((s, x) => s + (x.waitTime || 0), 0) / slice.length;

/**
 * buildEnrichedRows
 *
 * Returns an array of enriched row objects, one per session.
 * Each row has all 15+ features needed by either ML endpoint.
 *
 * @param {Array} sessions - Sorted (oldest→newest) history documents
 * @returns {Array} enriched rows
 */
function buildEnrichedRows(sessions) {
  const rows = [];
  let runningTotalScore = 0;

  for (let i = 0; i < sessions.length; i++) {
    const cur = sessions[i];
    const prev = i > 0 ? sessions[i - 1] : null;

    const score = Number(cur.sessionScore || 0);
    runningTotalScore += score;

    const cumInteractions = i + 1;
    const cumScoreMean = runningTotalScore / cumInteractions;

    // time_since_prev: seconds between this session and the previous one
    const timeSincePrev = prev
      ? (new Date(cur.sessionAt) - new Date(prev.sessionAt)) / 1000
      : 0;

    const diff = Number(cur.difficulty || 1);
    const timeSpentMin = Number(cur.timeSpent || 0);   // already in minutes
    const waitTimeMin = Number(cur.waitTime || 0);      // already in minutes
    const resourceScore = Number(cur.resourceScore || 0.055);

    // score_per_difficulty
    const scorePerDiff = diff > 0 ? score / diff : score;

    // rolling windows
    const s3  = lastN(sessions, i, 3);
    const s5  = lastN(sessions, i, 5);
    const s10 = lastN(sessions, i, 10);

    rows.push({
      // --- identifiers (needed for forecast payload) ---
      _sessionId:  cur._id,
      _userId:     cur.userId,
      _sessionAt:  cur.sessionAt,

      // --- features ---
      time_since_prev:       timeSincePrev,
      cum_interactions:      cumInteractions,
      cum_score_mean:        cumScoreMean,
      score_per_difficulty:  scorePerDiff,
      roll_mean_score_3:     avgScore(s3),
      roll_mean_score_5:     avgScore(s5),
      roll_mean_score_10:    avgScore(s10),
      roll_sum_time_spent_3:  sumTime(s3),
      roll_sum_time_spent_5:  sumTime(s5),
      roll_sum_time_spent_10: sumTime(s10),
      roll_mean_wait_3:      avgWait(s3),
      roll_mean_wait_5:      avgWait(s5),
      roll_mean_wait_10:     avgWait(s10),
      difficulty:            diff,
      wait_time:             waitTimeMin,
      resource_score:        resourceScore,
      time_spent:            timeSpentMin,

      // raw score (for forecast payload)
      score: score,
    });
  }

  return rows;
}

/**
 * buildCurrentPerformancePayload
 * Prepares the { rows } body for POST /current-performance.
 * Returns the last 32 enriched rows, each with the 15 ML features.
 *
 * @param {Array} sessions - All sessions sorted oldest→newest
 * @returns {{ rows: Array }}
 */
function buildCurrentPerformancePayload(sessions) {
  const enriched = buildEnrichedRows(sessions);
  const last32 = enriched.slice(-32);

  const rows = last32.map(r => ({
    time_since_prev:       r.time_since_prev,
    cum_interactions:      r.cum_interactions,
    cum_score_mean:        r.cum_score_mean,
    score_per_difficulty:  r.score_per_difficulty,
    roll_mean_score_3:     r.roll_mean_score_3,
    roll_mean_score_5:     r.roll_mean_score_5,
    roll_mean_score_10:    r.roll_mean_score_10,
    roll_sum_time_spent_3:  r.roll_sum_time_spent_3,
    roll_sum_time_spent_5:  r.roll_sum_time_spent_5,
    roll_mean_wait_3:      r.roll_mean_wait_3,
    roll_mean_wait_5:      r.roll_mean_wait_5,
    difficulty:            r.difficulty,
    wait_time:             r.wait_time,
    resource_score:        r.resource_score,
    time_spent:            r.time_spent,
  }));

  return { rows };
}

/**
 * buildForecastPayload
 * Prepares the { rows } body for POST /future-forecast.
 * Returns the last 10 enriched rows with all named fields the Flask API expects.
 *
 * @param {Array}  sessions  - All sessions sorted oldest→newest
 * @param {string} studentId - Mongo userId string
 * @returns {{ rows: Array } | null}  null if fewer than 10 sessions
 */
function buildForecastPayload(sessions, studentId) {
  if (sessions.length < 10) return null;

  const enriched = buildEnrichedRows(sessions);
  const last10 = enriched.slice(-10);

  const rows = last10.map(r => ({
    student_id:              studentId,
    timestamp:               new Date(r._sessionAt).toISOString().split("T")[0], // "YYYY-MM-DD"
    score:                   r.score,
    difficulty:              r.difficulty,
    wait_time:               r.wait_time,
    time_spent:              r.time_spent,
    resource_score:          r.resource_score,
    time_since_prev:         r.time_since_prev,
    cum_interactions:        r.cum_interactions,
    cum_score_mean:          r.cum_score_mean,
    score_per_difficulty:    r.score_per_difficulty,
    roll_mean_score_3:       r.roll_mean_score_3,
    roll_sum_time_spent_3:   r.roll_sum_time_spent_3,
    roll_mean_wait_3:        r.roll_mean_wait_3,
    roll_sum_time_spent_5:   r.roll_sum_time_spent_5,
    roll_mean_wait_5:        r.roll_mean_wait_5,
    roll_sum_time_spent_10:  r.roll_sum_time_spent_10,
    roll_mean_wait_10:       r.roll_mean_wait_10,
  }));

  return { rows };
}

/**
 * clampWaitTime
 * Clamps wait time (in minutes) to [0, WAIT_TIME_CAP].
 */
function clampWaitTime(minutes) {
  return Math.min(Math.max(0, minutes), WAIT_TIME_CAP);
}

/**
 * clampResourceScore
 * Clamps resource score to [0.055, 1.0].
 */
function clampResourceScore(score) {
  return Math.min(1.0, Math.max(0.055, score));
}

module.exports = {
  buildCurrentPerformancePayload,
  buildForecastPayload,
  clampWaitTime,
  clampResourceScore,
  WAIT_TIME_CAP,
};
