import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import Practitioner from "../models/Practitioner.js";
import Appointment from "../models/Appointment.js";

// Extend dayjs with required plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/** Check overlapping appointments */
export const hasConflict = async (practitionerId, start, end, excludeId = null) => {
  // Ensure start/end are dayjs objects
  const s = dayjs(start);
  const e = dayjs(end);
  const query = {
    practitioner: practitionerId,
    status: { $in: ["pending", "confirmed"] },
    $or: [
      { start: { $lt: e.toDate() }, end: { $gt: s.toDate() } }
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  const clash = await Appointment.findOne(query).lean();
  return !!clash;
};

/** Check if slot fits practitioner's availability and breaks */
export const fitsAvailability = async (practitionerId, start, end) => {
  const p = await Practitioner.findById(practitionerId).lean();
  if (!p) return false;
  const s = dayjs(start);
  const e = dayjs(end);
  if (!s.isValid() || !e.isValid()) return false;
  const weekday = s.day();
  const dayTemplate = (p.availability || []).find(a => a.weekday === weekday);
  if (!dayTemplate) return false;
  
  // Check if within available slots
  const inSlot = dayTemplate.slots.some(slot => {
    const ws = dayjs(`${s.format("YYYY-MM-DD")}T${slot.start}:00`);
    const we = dayjs(`${s.format("YYYY-MM-DD")}T${slot.end}:00`);
    return s.isSameOrAfter(ws) && e.isSameOrBefore(we);
  });
  if (!inSlot) return false;
  
  // Check breaks
  const inBreak = (p.breaks || []).some(b => {
    if (!b.date) return false;
    const bd = dayjs(b.date);
    if (!bd.isSame(s, "day")) return false;
    const bs = dayjs(`${s.format("YYYY-MM-DD")}T${b.start}:00`);
    const be = dayjs(`${s.format("YYYY-MM-DD")}T${b.end}:00`);
    return s.isBefore(be) && e.isAfter(bs);
  });
  return !inBreak;
};

/** Generate slots for practitioner & therapy duration */
/** Generate slots for practitioner & therapy duration */
export const generateSlots = async (practitionerId, therapyDurationMin, from, to) => {
  const slots = [];
  const step = therapyDurationMin; // Change: Use therapy duration as step instead of 15 min
  let cursor = dayjs(from);
  const endDate = dayjs(to);
  
  while (cursor.add(therapyDurationMin, "minute").isBefore(endDate) ||
         cursor.add(therapyDurationMin, "minute").isSame(endDate)) {
    const st = cursor;
    const en = cursor.add(therapyDurationMin, "minute");
    
    if (await fitsAvailability(practitionerId, st, en) &&
        !(await hasConflict(practitionerId, st, en))) {
      slots.push({ start: st.toISOString(), end: en.toISOString() });
    }
    cursor = cursor.add(step, "minute");
  }
  return slots;
};