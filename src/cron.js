const cron = require("node-cron");
const FollowUp = require("./models/FollowUp");
const Trial = require("./models/Trial");
const SaleActivation = require("./models/SaleActivation");
const TrialActivation = require("./models/TrialActivation");
const Attendance = require("./models/Attendance");
const User = require("./models/User");

const startCronJobs = () => {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const now = new Date();

      // Log current time for debugging
      console.log(`🔄 Cron running at: ${now.toISOString()}`);

      // ======= FollowUp Status Auto-Update =======
      const expired = await FollowUp.find({
        expiredAt: { $lte: now },
        salesPerson: { $exists: true, $ne: null },
      });

      if (expired.length === 0) {
        console.log("✅ No expired follow-ups found.");
      }

      if (expired.length > 0) {
        console.log(`⚠️ Found ${expired.length} expired follow-ups.`);

        // Now remove salesPerson field
        const result = await FollowUp.updateMany(
          {
            expiredAt: { $lte: now },
            salesPerson: { $exists: true, $ne: null },
          },
          [
            {
              $set: { lastSalePerson: "$salesPerson" }
            },
            {
              $unset: "salesPerson"
            }
          ]
        );

        console.log(`✅ Moved salesPerson → lastSalePerson for ${result.modifiedCount} follow-ups.`);

      }

      // ======= Trial Status Auto-Update =======
      console.log("Trial find start...");
      const expiredTrials = await Trial.updateMany(
        {
          validation: { $lte: now },
          status: "active",
        },
        {
          $set: { status: "done" },
        }
      );
      console.log("Trial Update successfully...");

      console.log(
        `⏳ Auto-updated ${expiredTrials.modifiedCount} expired trials to 'done'.`
      );
      // ======= Trial Activation Status Auto-Update =======
      console.log("Trial find start...");
      const expiredTrialsActivation = await TrialActivation.updateMany(
        {
          expirationDate: { $lte: now },
          status: "active",
        },
        {
          $set: { status: "done" },
        }
      );
      console.log("Trial Activation Update successfully...");

      console.log(
        `⏳ Auto-updated ${expiredTrialsActivation.modifiedCount} expired trials to 'done'.`
      );

      // // ======= Sale Expired Auto-Update =======
      console.log("Sale Expired (10-Day) check start...");

      const tenDaysLater = new Date();
      tenDaysLater.setDate(now.getDate() + 10);

      const expiredSale = await SaleActivation.updateMany(
        {
          expirationDate: { $gte: now, $lte: tenDaysLater }, // Within next 10 days
          status: "active",
        },
        {
          $set: { status: "expired-soon" },
        }
      );

      console.log("Sale status update completed...");
      console.log(
        `⏳ Auto-updated ${expiredSale.modifiedCount} sale activations to 'expired-soon'.`
      );
    } catch (err) {
      console.error("❌ Error updating expired trial:", err.message);
    }
  });
};



// Cron job: run at 6:05 AM every day (after night shift ends)
// cron.schedule("30 8 * * *", async () => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const employees = await User.find();

//     for (const emp of employees) {
//       const record = await Attendance.findOne({ user: emp._id, date: today });
//       if (!record) {
//         await Attendance.create({
//           user: emp._id,
//           date: today,
//           status: "absent",
//           type: "leave",
//           punchIn: null,
//           punchOut: null,
//           totalWorkingHours: 0,
//           totalBreakMinutes: 0,
//         });
//       }
//     }

//     console.log("✅ Absent entries created (after all shifts end)");
//   } catch (err) {
//     console.error("❌ Cron error:", err);
//   }
// });



module.exports = startCronJobs;
