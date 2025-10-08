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
// const punchIn = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) return res.status(400).json({ message: "userId required" });

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const now = new Date();

//     // check if already punched in
//     const openRecord = await Attendance.findOne({
//       user: userId,
//       punchOut: { $exists: false },
//     });
//     if (openRecord) {
//       return res.status(400).json({ message: "Already punched in" });
//     }

//     // Attendance date logic
//     const attendanceDate = new Date(now);

//     if (user.shiftType === "night") {
//       // If it's after midnight but before 8 AM → previous day
//       if (now.getHours() < 8) attendanceDate.setDate(attendanceDate.getDate() - 1);
//     }
//     attendanceDate.setHours(0, 0, 0, 0);

//     // Create or update attendance record
//     const record = await Attendance.findOneAndUpdate(
//       { user: userId, date: attendanceDate },
//       {
//         $set: {
//           punchIn: now,
//           status: "present",
//           type: "working",
//         },
//       },
//       { new: true, upsert: true }
//     );

//     res.json({ message: "✅ Punch-in recorded", record });
//   } catch (err) {
//     console.error("Punch-in error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };



// 🕕 Punch Out
// const punchOut = async (req, res) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) return res.status(400).json({ message: "userId required" });

//     const now = new Date();

//     const record = await Attendance.findOne({
//       user: userId,
//       punchOut: { $exists: false },
//     }).sort({ punchIn: -1 });

//     if (!record) return res.status(404).json({ message: "No active punch-in found" });

//     record.punchOut = now;

//     let breakMinutes = 0;
//     if (record.break1Start && record.break1End)
//       breakMinutes += (record.break1End - record.break1Start) / (1000 * 60);
//     if (record.lunchStart && record.lunchEnd)
//       breakMinutes += (record.lunchEnd - record.lunchStart) / (1000 * 60);
//     if (record.break2Start && record.break2End)
//       breakMinutes += (record.break2End - record.break2Start) / (1000 * 60);

//     record.totalBreakMinutes = Math.round(breakMinutes);

//     const totalHours = (record.punchOut - record.punchIn) / (1000 * 60 * 60);
//     record.totalWorkingHours = parseFloat(
//       (totalHours - breakMinutes / 60).toFixed(2)
//     );

//     record.status = "present";
//     record.type = "working";

//     await record.save();
//     res.json({ message: "✅ Punch-out recorded", record });
//   } catch (err) {
//     console.error("Punch-out error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };




// Break Start
// const startBreak = async (req, res) => {
//   try {
//     const { userId, type } = req.body; // type = "break1" | "lunch" | "break2"
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const record = await Attendance.findOne({ user: userId, date: today });
//     if (!record) return res.status(404).json({ message: "Not punched in today" });

//     const field = `${type}Start`;
//     record[field] = new Date();

//     await record.save();
//     res.json(record);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Break End
// const endBreak = async (req, res) => {
//   try {
//     const { userId, type } = req.body; // type = "break1" | "lunch" | "break2"
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const record = await Attendance.findOne({ user: userId, date: today });
//     if (!record) return res.status(404).json({ message: "Not punched in today" });

//     const field = `${type}End`;
//     record[field] = new Date();

//     await record.save();
//     res.json(record);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// Helper: compute type & status based on total hours
const computeAttendanceType = (totalHours) => {
  if (totalHours === 0) return { type: "leave", status: "absent" };
  if (totalHours < 4) return { type: "half-day", status: "present" };
  if (totalHours >= 4) return { type: "full-day", status: "present" };
  return { type: "leave", status: "absent" };
};

// 🕘 Punch In
const punchInOLD = async (req, res) => {
  try {
    const { userId, punchInTime } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = punchInTime ? new Date(punchInTime) : new Date();

    // Check if already punched in
    const openRecord = await Attendance.findOne({
      user: userId,
      punchOut: { $exists: false },
    });
    if (openRecord) return res.status(400).json({ message: "Already punched in" });

    // Determine attendance date based on shift
    const attendanceDate = new Date(now);
    if (user.shiftType === "night" && now.getHours() < 8) {
      attendanceDate.setDate(attendanceDate.getDate() - 1);
    }
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOneAndUpdate(
      { user: userId, date: attendanceDate },
      { $set: { punchIn: now, status: "present", type: "working" } },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Punch-in recorded", record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const punchIn = async (req, res) => {
  try {
    const { userId, punchInTime } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = punchInTime ? new Date(punchInTime) : new Date();

    // STEP 1️⃣ — Check if already punched in
    const openRecord = await Attendance.findOne({
      user: userId,
      punchOut: { $exists: false },
    });

    if (openRecord) {
      return res.status(200).json({
        message: "Already punched in — continuing current session",
        record: openRecord,
      });
    }

    // STEP 2️⃣ — Smart detection for night shift continuation
    let recentRecord;
    if (user.shiftType === "night") {
      // find last record (yesterday) with punchOut within last 6 hours
      const since = new Date(now);
      since.setHours(now.getHours() - 9);

      recentRecord = await Attendance.findOne({
        user: userId,
        punchOut: { $exists: true },
      }).sort({ date: -1 });

      // agar last punchOut 12am–8am ke beech hai aur abhi fir punchIn ho raha hai
      if (
        recentRecord &&
        recentRecord.punchOut &&
        now - recentRecord.punchOut < 8 * 60 * 60 * 1000 && // within 8 hrs
        now.getHours() < 8
      ) {
        // means it's a mistaken re-login → reuse previous record
        recentRecord.punchOut = undefined; // re-open previous
        await recentRecord.save();

        return res.status(200).json({
          message: "Re-opened previous night attendance record",
          record: recentRecord,
        });
      }
    }

    // STEP 3️⃣ — Determine attendance date
    const attendanceDate = new Date(now);
    if (user.shiftType === "night" && now.getHours() < 8) {
      attendanceDate.setDate(attendanceDate.getDate() - 1);
    }
    attendanceDate.setHours(0, 0, 0, 0);

    // STEP 4️⃣ — Create / update attendance
    const record = await Attendance.findOneAndUpdate(
      { user: userId, date: attendanceDate },
      {
        $set: {
          punchIn: now,
          status: "present",
          type: "working",
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: "✅ Punch-in recorded", record });
  } catch (err) {
    console.error("Punch-in error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🕕 Punch Out
const punchOut = async (req, res) => {
  try {
    const { userId, punchOutTime } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const now = punchOutTime ? new Date(punchOutTime) : new Date();

    const record = await Attendance.findOne({
      user: userId,
      punchOut: { $exists: false },
    }).sort({ punchIn: -1 });

    if (!record) return res.status(404).json({ message: "No active punch-in found" });

    record.punchOut = now;

    // Calculate break minutes
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

    // Update type & status automatically
    const auto = computeAttendanceType(record.totalWorkingHours);
    record.type = auto.type;
    record.status = auto.status;

    await record.save();
    res.json({ message: "✅ Punch-out recorded", record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Helper: safely parse date string or return null
const parseDateSafe = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.valueOf()) ? null : d;
};

const upsertAttendance = async (req, res) => {
  try {
    const { userId, punchIn, punchOut, type, status } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Determine attendance date
    let recordDate = parseDateSafe(punchIn) || parseDateSafe(punchOut) || new Date();
    recordDate.setHours(0, 0, 0, 0);

    // Find or create record
    let record = await Attendance.findOne({ user: userId, date: recordDate });
    if (!record) record = new Attendance({ user: userId, date: recordDate });

    // Set punches
    const punchInDate = parseDateSafe(punchIn);
    const punchOutDate = parseDateSafe(punchOut);

    if (punchInDate) record.punchIn = punchInDate;
    if (punchOutDate) {
      const outDate = new Date(punchOutDate);
      if (record.punchIn && outDate <= record.punchIn) outDate.setDate(outDate.getDate() + 1);
      record.punchOut = outDate;
    }

    // Calculate working hours
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

      const auto = computeAttendanceType(record.totalWorkingHours);
      record.type = auto.type;
      record.status = auto.status;
      // record.type = type?.trim() ? type : auto.type;
      // record.status = status?.trim() ? status : auto.status;
    } else {
      record.type = type?.trim() || record.type || "leave";
      record.status = status?.trim() || record.status || "absent";
      record.totalWorkingHours = record.totalWorkingHours || 0;
      record.totalBreakMinutes = record.totalBreakMinutes || 0;
    }

    await record.save();
    res.json({ message: "✅ Attendance updated", record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//🕒 Break Start
const startBreak = async (req, res) => {
  try {
    const { userId, type } = req.body; // type = "break1" | "lunch" | "break2"
    if (!userId || !type)
      return res.status(400).json({ message: "userId and type are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Determine correct attendance date
    let dateKey = new Date();
    if (user.shiftType === "night" && dateKey.getHours() < 8) {
      dateKey.setDate(dateKey.getDate() - 1);
    }
    dateKey.setHours(0, 0, 0, 0);

    // Find today's (or previous day’s for night shift) attendance record
    const record = await Attendance.findOne({ user: userId, date: dateKey });
    if (!record) return res.status(404).json({ message: "No active attendance record found" });

    const field = `${type}Start`;
    record[field] = new Date();

    await record.save();
    res.json({ message: `✅ ${type} started`, record });
  } catch (err) {
    console.error("Start break error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🕓 Break End
const endBreak = async (req, res) => {
  try {
    const { userId, type } = req.body; // type = "break1" | "lunch" | "break2"
    if (!userId || !type)
      return res.status(400).json({ message: "userId and type are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Determine correct attendance date
    let dateKey = new Date();
    if (user.shiftType === "night" && dateKey.getHours() < 8) {
      dateKey.setDate(dateKey.getDate() - 1);
    }
    dateKey.setHours(0, 0, 0, 0);

    // Find today's (or previous day’s for night shift) attendance record
    const record = await Attendance.findOne({ user: userId, date: dateKey });
    if (!record) return res.status(404).json({ message: "No active attendance record found" });

    const field = `${type}End`;
    record[field] = new Date();

    await record.save();
    res.json({ message: `✅ ${type} ended`, record });
  } catch (err) {
    console.error("End break error:", err);
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
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // include entire day

      filter.date = { $gte: start, $lte: end };
    }


    const records = await Attendance.find(filter).populate("user");
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper: Convert "HH:mm" string to Date object on a given day
// const timeStringToDate = (timeStr, baseDate) => {
//   const [hours, minutes] = timeStr.split(':').map(Number);
//   const date = new Date(baseDate);
//   date.setHours(hours, minutes, 0, 0);
//   return date;
// };

// Helper: compute type & status based on total hours
// const computeAttendanceType = (totalHours) => {
//   if (totalHours === 0) return { type: "leave", status: "absent" };
//   if (totalHours < 4) return { type: "half-day", status: "present" };
//   if (totalHours >= 4) return { type: "full-day", status: "present" };
//   return { type: "leave", status: "absent" };
// };

// Main upsert function
// const upsertAttendance = async (req, res) => {
//   try {
//     const { userId, punchIn, punchOut, type, status } = req.body;
//     if (!userId) return res.status(400).json({ message: "userId is required" });

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Find existing record for today
//     let record = await Attendance.findOne({ user: userId, date: today }).populate('user');
//     if (!record) record = new Attendance({ user: userId, date: today });

//     // Set punchIn/punchOut
//     if (punchIn) record.punchIn = timeStringToDate(punchIn, today);

//     if (punchOut) {
//       let outDate = timeStringToDate(punchOut, today);

//       // If punchOut is earlier than punchIn, it's the next day
//       if (record.punchIn && outDate <= record.punchIn) {
//         outDate.setDate(outDate.getDate() + 1);
//       }
//       record.punchOut = outDate;
//     }

//     // Calculate total working hours
//     if (record.punchIn && record.punchOut) {
//       let breakMinutes = 0;
//       if (record.break1Start && record.break1End)
//         breakMinutes += (record.break1End - record.break1Start) / (1000 * 60);
//       if (record.lunchStart && record.lunchEnd)
//         breakMinutes += (record.lunchEnd - record.lunchStart) / (1000 * 60);
//       if (record.break2Start && record.break2End)
//         breakMinutes += (record.break2End - record.break2Start) / (1000 * 60);

//       record.totalBreakMinutes = Math.round(breakMinutes);

//       const totalHours = (record.punchOut - record.punchIn) / (1000 * 60 * 60);
//       record.totalWorkingHours = parseFloat((totalHours - breakMinutes / 60).toFixed(2));

//       // Auto type & status
//       const auto = computeAttendanceType(record.totalWorkingHours);

//       // Apply manual override if provided, else auto
//       record.type = type?.trim() ? type : auto.type;
//       record.status = status?.trim() ? status : auto.status;
//     } else {
//       // No punches, apply manual override or default
//       record.type = type?.trim() || record.type || "leave";
//       record.status = status?.trim() || record.status || "absent";
//       record.totalWorkingHours = record.totalWorkingHours || 0;
//       record.totalBreakMinutes = record.totalBreakMinutes || 0;
//     }

//     await record.save();
//     res.json(record);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };
// const upsertAttendance = async (req, res) => {
//   try {
//     const { userId, punchIn, punchOut, type, status } = req.body;
//     if (!userId) return res.status(400).json({ message: "userId is required" });

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const now = new Date();
//     let attendanceDate = new Date(now);
//     attendanceDate.setHours(0, 0, 0, 0); // default "today"

//     // Determine correct date based on shift
//     if (user.shiftType === "night") {
//       // Night shift runs 6 PM - 8 AM
//       // If time is before 8 AM, it belongs to previous day
//       if (punchIn) {
//         const [h, m] = punchIn.split(":").map(Number);
//         if (h < 8) attendanceDate.setDate(attendanceDate.getDate() - 1);
//       }
//       if (punchOut && !punchIn) {
//         const [h, m] = punchOut.split(":").map(Number);
//         if (h < 8) attendanceDate.setDate(attendanceDate.getDate() - 1);
//       }
//     }

//     // Find existing record or create new
//     let record = await Attendance.findOne({ user: userId, date: attendanceDate });
//     if (!record) record = new Attendance({ user: userId, date: attendanceDate });

//     // Convert time string to Date
//     const timeStringToDate = (timeStr, baseDate) => {
//       const [hours, minutes] = timeStr.split(":").map(Number);
//       const date = new Date(baseDate);
//       date.setHours(hours, minutes, 0, 0);
//       return date;
//     };

//     if (punchIn) record.punchIn = timeStringToDate(punchIn, attendanceDate);
//     if (punchOut) {
//       let outDate = timeStringToDate(punchOut, attendanceDate);

//       // If punchOut earlier than punchIn → next day
//       if (record.punchIn && outDate <= record.punchIn) {
//         outDate.setDate(outDate.getDate() + 1);
//       }
//       record.punchOut = outDate;
//     }

//     // Calculate total working hours & breaks
//     let breakMinutes = 0;
//     if (record.break1Start && record.break1End)
//       breakMinutes += (record.break1End - record.break1Start) / (1000 * 60);
//     if (record.lunchStart && record.lunchEnd)
//       breakMinutes += (record.lunchEnd - record.lunchStart) / (1000 * 60);
//     if (record.break2Start && record.break2End)
//       breakMinutes += (record.break2End - record.break2Start) / (1000 * 60);

//     record.totalBreakMinutes = Math.round(breakMinutes);

//     if (record.punchIn && record.punchOut) {
//       const totalHours = (record.punchOut - record.punchIn) / (1000 * 60 * 60);
//       record.totalWorkingHours = parseFloat((totalHours - breakMinutes / 60).toFixed(2));

//       // Auto compute type & status
//       const computeAttendanceType = (totalHours) => {
//         if (totalHours === 0) return { type: "leave", status: "absent" };
//         if (totalHours < 4) return { type: "half-day", status: "present" };
//         return { type: "full-day", status: "present" };
//       };
//       const auto = computeAttendanceType(record.totalWorkingHours);

//       record.type = type?.trim() || auto.type;
//       record.status = status?.trim() || auto.status;
//     } else {
//       record.type = type?.trim() || record.type || "leave";
//       record.status = status?.trim() || record.status || "absent";
//       record.totalWorkingHours = record.totalWorkingHours || 0;
//     }

//     await record.save();
//     res.json({ message: "✅ Attendance upserted", record });
//   } catch (err) {
//     console.error("Upsert Attendance Error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };




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
        // record.totalWorkingHours = 8;
        break;
      case "half-day":
        record.type = "half-day";
        record.status = "present";
        // record.totalWorkingHours = 4;s
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
