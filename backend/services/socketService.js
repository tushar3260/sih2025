/**
 * socketService.js
 * Singleton io instance + helpers used by all controllers.
 * Prevents circular imports between server.js and controllers.
 */

let _io = null;

/** Called once from server.js after io is created */
export const setIo = (ioInstance) => {
  _io = ioInstance;
};

/**
 * Emit "newAppointment" to a doctor's personal room.
 * @param {string} doctorUserId - The User._id of the doctor
 */
export const notifyDoctor = (doctorUserId, data) => {
  if (_io) {
    _io.to(`doctor-${doctorUserId}`).emit("newAppointment", data);
  }
};

/**
 * Emit "notification" to any user's personal room.
 * Used for patient notifications (booking confirmed, cancelled, etc.)
 * @param {string} userId - The User._id of the recipient
 * @param {object} notification - Notification payload
 */
export const notifyUser = (userId, notification) => {
  if (_io) {
    _io.to(`user-${userId}`).emit("notification", notification);
  }
};

/** Get the raw io instance if needed */
export const getIo = () => _io;
