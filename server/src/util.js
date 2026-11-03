export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const URGENCY_RANK = { emergency: 0, urgent: 1, routine: 2 };
