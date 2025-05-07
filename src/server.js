const express = require("express");
const connectDB = require("./config/database");
const cloudinary = require("cloudinary").v2;
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const startCronJobs = require("./cron");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const PersonalMessage = require("./models/PersonalMessage");
const Sales = require("./models/Sales");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join personal room
  socket.on("joinRoom", ({ userId }) => {
    socket.join(userId); // personal room for private chats
  });

  // Global chat
  socket.on("chatMessage", async (data) => {
    const { sender, content } = data;

    try {
      const newMsg = await Message.create({ sender, content });

      const populatedMsg = await newMsg.populate("sender", "name");

      io.emit("chatMessage", populatedMsg); // Global chat
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // Private chat
  socket.on("privateMessage", async (data) => {
    const { sender, receiver, message, team } = data;

    try {
      const savedMsg = await PersonalMessage.create({
        sender,
        receiver,
        message,
        team,
      });

      // Populate sender before emitting
      const populatedMsg = await savedMsg.populate("sender", "name");

      io.to(receiver).emit("privateMessage", populatedMsg); // Send to receiver
      socket.emit("privateMessage", populatedMsg); // Echo to sender
    } catch (err) {
      console.error("Message Save Error:", err);
    }
  });

  // Sale create alert
  socket.on("createSale", async (data) => {
    const { assignedEmployee, saleId } = data;
    const employee = await Sales.findById(saleId).populate({
      path: "assignedEmployee",
      select: "name email role team",
      populate: {
        path: "team",
        select: "name",
      },
    });

    io.emit("new-sale", {
      message: "A new sale has been created!",
      saleId,
      assignedEmployee: employee,
    });
  });

  // Sale update alert
  // socket.on("updateSale", (data) => {
  //   const { saleId, status, assignedEmployee } = data;

  //   io.emit("sale-updated", {
  //     message: `Sale updated! Status changed to: ${status}`,
  //     saleId,
  //     status,
  //     assignedEmployee,
  //   });
  // });

  // Activation create alert
  socket.on("createActivation", (data) => {
    const { assignedEmployee, activationId } = data;

    io.emit("new-activation", {
      message: "A new activation has been created!",
      activationId,
      assignedEmployee,
    });
  });

  // Activation update alert
  socket.on("updateActivation", (data) => {
    const { activationId, status, assignedEmployee } = data;

    io.emit("activation-updated", {
      message: `Activation updated! Status changed to: ${status}`,
      activationId,
      status,
      assignedEmployee,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.set("io", io);

// Middleware
app.use(express.json());
app.use(cors());
app.options("*", cors());
app.use("/api", userRoutes);

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect to DB and start cron jobs
connectDB();
startCronJobs();

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

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server Running at PORT :${PORT}`);
});
