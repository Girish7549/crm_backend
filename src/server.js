// server.js (CommonJS)
const express = require("express");
const connectDB = require("./config/database");
const cloudinary = require("cloudinary").v2;
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const startCronJobs = require("./cron");
const http = require("http");
const { Server } = require("socket.io");

// Models
const Message = require("./models/Message");
const PersonalMessage = require("./models/PersonalMessage");
const Sales = require("./models/Sales");
const SaleActivation = require("./models/SaleActivation");
const Customer = require("./models/Customer");
const User = require("./models/User");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // or set your frontend origin for security
    methods: ["GET", "POST"],
  },
});

// Make io available to routes if needed
app.set("io", io);

// ============== SINGLE Socket.IO connection handler ==============
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // --------- Online/Offline tracking ----------
  socket.on("employeeLogin", async (userId) => {
    try {
      socket.userId = userId; // bind user to this socket
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });
      io.emit("employeeStatus", { userId, isOnline: true });
    } catch (err) {
      console.error("employeeLogin error:", err);
    }
  });

  // --------- Rooms for private chat -----------
  // socket.on("joinRoom", ({ userId }) => {
  //   try {
  //     socket.join(userId); // personal room
  //   } catch (err) {
  //     console.error("joinRoom error:", err);
  //   }
  // });
  // --------- Rooms for private chat -----------
  socket.on("joinRoom", ({ userId }) => {
    try {
      socket.join(userId.toString()); // join a room named after the userId
      console.log(`User ${userId} joined their private room`);
    } catch (err) {
      console.error("joinRoom error:", err);
    }
  });


  // --------- Global chat ----------------------
  socket.on("chatMessage", async (data) => {
    const { sender, content } = data || {};
    try {
      const newMsg = await Message.create({ sender, content });
      const populatedMsg = await newMsg.populate("sender", "name");
      io.emit("chatMessage", populatedMsg);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // --------- Private chat ---------------------
socket.on("privateMessage", async (data) => {
  const { sender, receiver, message, team } = data || {};
  try {
    const savedMsg = await PersonalMessage.create({
      sender,
      receiver,
      message,
      team,
    });

    const populatedMsg = await savedMsg.populate([
      { path: "sender", select: "name role team" },
      { path: "receiver", select: "name role team" },
      { path: "team", select: "name" },
    ]);

    // ✅ Emit to both sender and receiver rooms
    io.to(sender.toString()).emit("privateMessage", populatedMsg);
    io.to(receiver.toString()).emit("privateMessage", populatedMsg);

  } catch (err) {
    console.error("Message Save Error:", err);
  }
});



  // --------- Sale create alert ----------------
  socket.on("createSale", async (data) => {
    const { saleId } = data || {};
    try {
      const employee = await Sales.findById(saleId).populate({
        path: "assignedEmployee",
        select: "name email role team",
        populate: { path: "team", select: "name" },
      });

      io.emit("new-sale", {
        message: "A new sale has been created!",
        saleId,
        assignedEmployee: employee,
      });
    } catch (err) {
      console.error("createSale error:", err);
    }
  });

  // --------- Activation create alert ----------
  socket.on("createActivation", async (data) => {
    const { activationId } = data || {};
    try {
      const support = await SaleActivation.findById(activationId).populate({
        path: "assignedEmployee",
        select: "name email role team",
        populate: { path: "team", select: "name" },
      });

      // NOTE: If you need sale.assignedEmployee, make sure SaleActivation has `sale` field populated
      // Here we assume support.sale exists and has assignedEmployee
      let employee = null;
      if (support?.sale?.assignedEmployee) {
        employee = await User.findById(support.sale.assignedEmployee).populate({
          path: "team",
          select: "name",
        });
      }

      const customer = await Customer.findById(support.customer); // populate({ ...fields }) not valid this way

      console.log("Sale Executive :", employee?.name);
      console.log("Support :", support?.assignedEmployee?.name);

      io.emit("new-activation", {
        message: "A new activation has been created!!!",
        activationId,
        support,
        assignedEmployee: employee,
        customer,
      });
    } catch (err) {
      console.error("createActivation error:", err);
    }
  });

  // --------- Activation update alert ----------
  socket.on("updateActivation", (data) => {
    const { activationId, status, assignedEmployee } = data || {};
    io.emit("activation-updated", {
      message: `Activation updated! Status changed to: ${status}`,
      activationId,
      status,
      assignedEmployee,
    });
  });

  // --------- Disconnect (mark offline) --------
  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });
        io.emit("employeeStatus", {
          userId: socket.userId,
          isOnline: false,
        });
      }
      console.log("User disconnected:", socket.id);
    } catch (err) {
      console.error("disconnect error:", err);
    }
  });
});

// ================== Middleware & Routes ==================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.options("*", cors());
app.set("trust proxy", true);
app.use("/api", userRoutes);

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// DB & Cron
connectDB();
startCronJobs();

// Health
app.get("/", (req, res) => {
  res.status(200).send(`
    <html>
      <head><title>Server Status</title></head>
      <body>
        <h1>Listening at port ${process.env.PORT}</h1>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server Running at PORT :${PORT}`);
});
