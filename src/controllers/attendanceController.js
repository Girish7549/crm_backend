const Attendance = require("../models/Attendance");
const User = require("../models/User");

// Punch In
// const punchIn = async (req, res) => {
//   try {
//     const { userId } = req.body;

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     let record = await Attendance.findOne({ user: userId, date: today });
//     if (record) {
//       return res.status(400).json({ message: "Already punched in today" });
//     }

//     record = new Attendance({
//       user: userId,
//       date: today,
//       punchIn: new Date(),
//     });

//     await record.save();
//     res.json(record);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // Punch Out
// const punchOut = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const record = await Attendance.findOne({ user: userId, date: today });
//     if (!record) return res.status(404).json({ message: "Not punched in today" });

//     record.punchOut = new Date();

//     // Calculate break minutes
//     let breakMinutes = 0;
//     if (record.break1Start && record.break1End)
//       breakMinutes += (record.break1End - record.break1Start) / (1000 * 60);
//     if (record.lunchStart && record.lunchEnd)
//       breakMinutes += (record.lunchEnd - record.lunchStart) / (1000 * 60);
//     if (record.break2Start && record.break2End)
//       breakMinutes += (record.break2End - record.break2Start) / (1000 * 60);

//     record.totalBreakMinutes = Math.round(breakMinutes);

//     // Calculate working hours
//     const totalHours =
//       (record.punchOut - record.punchIn) / (1000 * 60 * 60);
//     record.totalWorkingHours = parseFloat(
//       (totalHours - breakMinutes / 60).toFixed(2)
//     );

//     await record.save();
//     res.json(record);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// 🕘 Punch In
const punchIn = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const now = new Date();

    // 1️⃣ Check if there's already an open record (punched in but not out)
    const openRecord = await Attendance.findOne({
      user: userId,
      punchOut: { $exists: false },
    });

    if (openRecord) {
      return res.status(400).json({ message: "You are already punched in" });
    }

    // 2️⃣ Determine attendance date (shift start date)
    // If punchIn after midnight but before 6 AM, consider it part of previous day’s shift
    const attendanceDate = new Date(now);
    if (now.getHours() < 6) {
      attendanceDate.setDate(attendanceDate.getDate() - 1);
    }
    attendanceDate.setHours(0, 0, 0, 0);

    // 3️⃣ Create new attendance record
    const record = new Attendance({
      user: userId,
      date: attendanceDate, // base attendance date
      punchIn: now,
    });

    await record.save();
    res.json({ message: "Punch-in recorded", record });
  } catch (err) {
    console.error("Punch-in error:", err);
    res.status(500).json({ error: err.message });
  }
};


// 🕕 Punch Out
const punchOut = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const now = new Date();

    // 1️⃣ Find the most recent open attendance (not punched out yet)
    const record = await Attendance.findOne({
      user: userId,
      punchOut: { $exists: false },
    }).sort({ punchIn: -1 });

    if (!record) {
      return res.status(404).json({ message: "No active punch-in found" });
    }

    // 2️⃣ Assign punchOut
    record.punchOut = now;

    // 3️⃣ Calculate total break time (optional fields)
    let breakMinutes = 0;
    if (record.break1Start && record.break1End)
      breakMinutes += (record.break1End - record.break1Start) / (1000 * 60);
    if (record.lunchStart && record.lunchEnd)
      breakMinutes += (record.lunchEnd - record.lunchStart) / (1000 * 60);
    if (record.break2Start && record.break2End)
      breakMinutes += (record.break2End - record.break2Start) / (1000 * 60);

    record.totalBreakMinutes = Math.round(breakMinutes);

    // 4️⃣ Calculate working hours (cross-day safe)
    const totalHours = (record.punchOut - record.punchIn) / (1000 * 60 * 60);
    record.totalWorkingHours = parseFloat(
      (totalHours - breakMinutes / 60).toFixed(2)
    );

    await record.save();
    res.json({ message: "Punch-out recorded", record });
  } catch (err) {
    console.error("Punch-out error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { punchIn, punchOut };


// Break Start
const startBreak = async (req, res) => {
  try {
    const { userId, type } = req.body; // type = "break1" | "lunch" | "break2"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ user: userId, date: today });
    if (!record) return res.status(404).json({ message: "Not punched in today" });

    const field = `${type}Start`;
    record[field] = new Date();

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Break End
const endBreak = async (req, res) => {
  try {
    const { userId, type } = req.body; // type = "break1" | "lunch" | "break2"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ user: userId, date: today });
    if (!record) return res.status(404).json({ message: "Not punched in today" });

    const field = `${type}End`;
    record[field] = new Date();

    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const filter = {};

    if (userId && userId !== "all") {
      filter.user = userId;
    }

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const records = await Attendance.find(filter).populate("user");
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper: Convert "HH:mm" string to Date object on a given day
const timeStringToDate = (timeStr, baseDate) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// Helper: compute type & status based on total hours
const computeAttendanceType = (totalHours) => {
  if (totalHours === 0) return { type: "leave", status: "absent" };
  if (totalHours < 4) return { type: "half-day", status: "present" };
  if (totalHours >= 4) return { type: "full-day", status: "present" };
  return { type: "leave", status: "absent" };
};

// Main upsert function
const upsertAttendance = async (req, res) => {
  try {
    const { userId, punchIn, punchOut, type, status } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find existing record for today
    let record = await Attendance.findOne({ user: userId, date: today }).populate('user');
    if (!record) record = new Attendance({ user: userId, date: today });

    // Set punchIn/punchOut
    if (punchIn) record.punchIn = timeStringToDate(punchIn, today);

    if (punchOut) {
      let outDate = timeStringToDate(punchOut, today);

      // If punchOut is earlier than punchIn, it's the next day
      if (record.punchIn && outDate <= record.punchIn) {
        outDate.setDate(outDate.getDate() + 1);
      }
      record.punchOut = outDate;
    }

    // Calculate total working hours
    if (record.punchIn && record.punchOut) {
      let breakMinutes = 0;
      if (record.break1Start && record.break1End)
        breakMinutes += (record.break1End - record.break1Start) / (1000 * 60);
      if (record.lunchStart && record.lunchEnd)
        breakMinutes += (record.lunchEnd - record.lunchStart) / (1000 * 60);
      if (record.break2Start && record.break2End)
        breakMinutes += (record.break2End - record.break2Start) / (1000 * 60);

      record.totalBreakMinutes = Math.round(breakMinutes);

      const totalHours = (record.punchOut - record.punchIn) / (1000 * 60 * 60);
      record.totalWorkingHours = parseFloat((totalHours - breakMinutes / 60).toFixed(2));

      // Auto type & status
      const auto = computeAttendanceType(record.totalWorkingHours);

      // Apply manual override if provided, else auto
      record.type = type?.trim() ? type : auto.type;
      record.status = status?.trim() ? status : auto.status;
    } else {
      // No punches, apply manual override or default
      record.type = type?.trim() || record.type || "leave";
      record.status = status?.trim() || record.status || "absent";
      record.totalWorkingHours = record.totalWorkingHours || 0;
      record.totalBreakMinutes = record.totalBreakMinutes || 0;
    }

    await record.save();
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};



// Tag Attendance manually (FD / HD / Leave / Paid Leave)
const tagAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;
    const record = await Attendance.findById(id).populate('user');
    if (!record) return res.status(404).json({ message: "Attendance not found" });

    switch (type) {
      case "full-day":
        record.type = "full-day";
        record.status = "present";
        record.totalWorkingHours = 8;
        break;
      case "half-day":
        record.type = "half-day";
        record.status = "present";
        record.totalWorkingHours = 4;
        break;
      case "leave":
        record.type = "leave";
        record.status = "absent";
        record.totalWorkingHours = 0;
        record.punchIn = null;
        record.punchOut = null;
        record.totalBreakMinutes = 0;
        break;
      case "paid-leave":
        record.type = "paid-leave";
        record.status = "on-leave";
        record.totalWorkingHours = 0;
        record.punchIn = null;
        record.punchOut = null;
        record.totalBreakMinutes = 0;
        break;
      default:
        break;
    }

    await record.save();
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Attendance Record
const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    await Attendance.findByIdAndDelete(id);
    res.json({ message: "Attendance record deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};





module.exports = { punchIn, punchOut, startBreak, endBreak, getAttendance, deleteAttendance, upsertAttendance, tagAttendance }
