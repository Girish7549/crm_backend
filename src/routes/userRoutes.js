const express = require("express");
const {createUser,getUser,getAllUser,deleteUser,updateUser,
} = require("../controllers/userController");
const {createService,getService, updateService,
} = require("../controllers/serviceController");
const { login } = require("../controllers/authController");
const {createCustomer,getCustomer,updateCustomer,deleteCustomer,getEmpCustomer,createRefferedCustomer, getEmpCustomerNotSale,
} = require("../controllers/customerController");
const {createSale,getAllSale,getSaleByEmp,updateSale,deleteSale,getSalesByTeam,getTeamPendingSale,
} = require("../controllers/saleController");
const {createFollowUp,getAllFollowUps,getFollowUpById,deleteFollowUp,updateFollowUp,
} = require("../controllers/followupController");
const {createCallback,getEmpCallback,updateCallback,
} = require("../controllers/callbackController");
const {createNotification,getNotificationsByEmployee,deleteNotification,
} = require("../controllers/notificationController");
const {getAllTrials,getTrialsByEmployeeId,updateTrial,createTrial,deleteTrial,getTrialByTeam,
} = require("../controllers/trialController");
const {getMessage,createMessage,
} = require("../controllers/messageController");
const { createTeam, getAllTeams } = require("../controllers/teamController");
const {createActivation,getAllActivations,getActivationById,updateActivation,deleteActivation,getAllSupportActivation,getTeamActivations,addMonthInActivation,getTeamStatusFilterActivations,
} = require("../controllers/activationController");
const {getPersonalMessage,
} = require("../controllers/personalMessageController");

const router = express.Router();
const upload = require("../config/multer");
const {createTrialActivation,getAllTrialActivations,getTrialActivationById,updateTrialActivation,deleteTrialActivation,getAllSupportTrialActivation,getTeamTrialActivation,
} = require("../controllers/trialActivationController");
const {createMacAddress,deleteMacAddress,updateMacAddress,getMacAddressById,checkMacExists,getAllMacAddresses,
} = require("../controllers/macAddressController");
const { getActivationDashboard, getSaleDashboard } = require("../controllers/dashboard");
const {createAttendence} = require("../controllers/attendanceController")


// User Routes
router.get("/service", getService);
router.put("/service/:id", updateService);
router.get("/users", getAllUser);
router.get("/user/:id", getUser);
router.put("/user/:id", updateUser);
router.post("/register", createUser);
router.post("/service", createService);
router.post("/login", login);
router.delete("/user/:id", deleteUser);

// Attendence Routes
router.post("/attendance", createAttendence);


// Customer Routes
router.get("/customer", getCustomer);
router.get("/customer/employee/:id", getEmpCustomer);
router.get("/customer-Not-Sale/employee/:id", getEmpCustomerNotSale);
router.put("/customer/:id", updateCustomer);
router.post("/customer", createCustomer);
router.post("/reffers-customer", createRefferedCustomer);
router.delete("/customer/:id", deleteCustomer);

// Callback Routes
router.get("/callback/employee/:id", getEmpCallback);
router.put("/callback/:id", updateCallback);
router.post("/callback", createCallback);

// Notification Routes
router.post("/notification", createNotification);
router.get("/notification/employee/:id", getNotificationsByEmployee);
router.delete("/notification/:id", deleteNotification);

// Trial Routes
router.get("/trials", getAllTrials);
router.get("/trial/team/:id", getTrialByTeam);
router.get("/trial/employee/:id", getTrialsByEmployeeId);
router.post("/trial", createTrial);
router.put("/trial/:id", updateTrial);
router.delete("/trial/:id", deleteTrial);

// Team Routes
router.post("/team", createTeam);
router.get("/teams", getAllTeams);

// Sale Routes
router.get("/sales", getAllSale);
router.get("/sales/team/:id", getSalesByTeam);
router.get("/sales/employee/:id", getSaleByEmp);
router.get("/sales/team-pending/:id", getTeamPendingSale);
// router.post("/sale", upload.single("paymentProof"), createSale);
// router.put("/sale/:id", upload.array("paymentProof", 5), updateSale); // 5 image ki limit lagai hai bss
// For multiple fields (PUT request for update)
router.put(
  "/sale/:id",
  upload.fields([
    { name: "paymentProof", maxCount: 5 },
    { name: "voiceProof", maxCount: 1 },
  ]),
  updateSale
);

// For single file (POST request for create)
router.post(
  '/sale',
  upload.fields([
    { name: 'paymentProof', maxCount: 5 },
    { name: 'voiceProof', maxCount: 1 }, // optional
  ]),
  createSale
);

// router.post("/sale", upload.single("paymentProof"), createSale);

router.delete("/sale/:id", deleteSale);

// Sale Activation Routes
router.post("/activations", createActivation);
router.get("/activations", getAllActivations);
router.get("/activations/team/:id", getTeamActivations);
router.get("/activations/team-status/:id", getTeamStatusFilterActivations);
router.get("/activations/:id", getActivationById);
router.get("/activations/support/:id", getAllSupportActivation);
router.put("/activations/:id", updateActivation);
router.put("/activations/addMonth/:id", addMonthInActivation);
router.delete("/activations/:id", deleteActivation);

// Trial Activation Routes
router.post("/trialActivations", createTrialActivation);
router.get("/trialActivations", getAllTrialActivations);
router.get("/trialActivations/team/:id", getTeamTrialActivation);
router.get("/trialActivations/:id", getTrialActivationById);
router.get("/trialActivations/support/:id", getAllSupportTrialActivation);
router.put("/trialActivations/:id", updateTrialActivation);
router.delete("/trialActivations/:id", deleteTrialActivation);

// Follow-Ups
router.get("/followUps", getAllFollowUps);
router.get("/followUps/employee/:id", getFollowUpById);
router.put("/followUps/:id", updateFollowUp);
router.post("/followUps", createFollowUp);
router.delete("/followUps/:id", deleteFollowUp);

// Message Group Chat
router.get("/chats", getMessage);
router.post("/chat", createMessage);

// Personal Chat
router.get("/dm", getPersonalMessage);

// Mac-Address
router.post("/macAddress", createMacAddress);
router.get("/macAddress", getAllMacAddresses);
router.get("/check-mac", checkMacExists);
router.get("/macAddress/:id", getMacAddressById);
router.put("/macAddress/:id", updateMacAddress);
router.delete("/macAddress/:id", deleteMacAddress);

// Dashboard Data 
router.get("/activationDashboard", getActivationDashboard);
router.get("/saleDashboard/:id", getSaleDashboard);


module.exports = router;
