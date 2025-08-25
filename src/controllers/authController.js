// const User = require("../models/User");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email }).populate({
//       path: "assignedService",
//       select: "_id name description",
//     });
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: `User not exist with this email : ${email}`,
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid Credential`,
//       });
//     }

//     const token = await jwt.sign(
//       { id: user._id, role: user.role, id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "24h" }
//     );
//     res.status(200).json({
//       success: true,
//       message: `Login Successfully`,
//       data: {
//         token,
//         role: user.role,
//         id: user._id,
//         service: user.assignedService,
//         trialCount: user.trialCount,
//         teamId: user.team
//       },
//     });
//   } catch (err) {
//     console.log(err);
//   }
// };

// module.exports = { login };

const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const OFFICE_LAT = 28.5939383;
const OFFICE_LNG = 77.3186998;
const OFFICE_RADIUS_METERS = 10;

const isWithinRadius = (lat1, lon1, lat2, lon2, radiusMeters) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d <= radiusMeters;
};

const login = async (req, res) => {
  try {
    const { email, password, location } = req.body;

    function normalizeIP(ip) {
      if (!ip) return "";
      ip = String(ip).trim();
      ip = ip.replace(/^::ffff:/, ""); // IPv4-mapped IPv6
      ip = ip.split("%")[0]; // remove zone index like fe80::1%25en0
      return ip;
    }

    function getClientIP(req) {
      // Prefer standard proxy/cdn headers
      if (req.headers["cf-connecting-ip"])
        return normalizeIP(req.headers["cf-connecting-ip"]);
      if (req.headers["x-real-ip"])
        return normalizeIP(req.headers["x-real-ip"]);
      const xff = req.headers["x-forwarded-for"];
      if (xff) {
        const parts = xff
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length) return normalizeIP(parts[0]); // left-most is original client
      }
      if (req.ip) return normalizeIP(req.ip);
      // fallback
      const remote =
        (req.connection && req.connection.remoteAddress) ||
        (req.socket && req.socket.remoteAddress) ||
        "";
      return normalizeIP(remote);
    }

    const clientIP = getClientIP(req);
    console.log("IP ADDRESS LOGIN DEVICE :", clientIP);

    const user = await User.findOne({ email }).populate({
      path: "assignedService",
      select: "_id name description",
    });

    if (user.role !== "admin" && user.role !== "activation") {
      if (!location || !location.latitude || !location.longitude) {
        return res.status(400).json({
          success: false,
          message: "Location data is required to login from office.",
        });
      }

      const { latitude, longitude } = location;
      const isInsideOffice = isWithinRadius(
        latitude,
        longitude,
        OFFICE_LAT,
        OFFICE_LNG,
        OFFICE_RADIUS_METERS
      );

      // if (!isInsideOffice) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "You must be inside the office to log in.",
      //   });
      // }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User does not exist with email: ${email}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: `Invalid credentials.`,
      });
    }

    const token = await jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: `Login successful`,
      data: {
        token,
        role: user.role,
        id: user._id,
        clientIP: clientIP,
        service: user.assignedService,
        trialCount: user.trialCount,
        teamId: user.team,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

module.exports = { login };
