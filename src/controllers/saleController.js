const Sales = require("../models/Sales");
const SaleActivation = require("../models/SaleActivation");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const cloudinary = require("../config/cloudinaryConfig");
const mongoose = require("mongoose");

// const createSale = async (req, res) => {
//   try {
//     const {
//       customer,
//       service,
//       saleItems,
//       paymentMethod,
//       assignedEmployee,
//       status,
//     } = req.body;

//     let paymentProofUrl = "";
//     const parsedSaleItems = JSON.parse(saleItems);

//     const totalAmountPrice = parsedSaleItems.reduce(
//       (sum, item) => sum + item.amount,
//       0
//     );

//     if (req.file) {
//       const uploadedImage = await cloudinary.uploader.upload_stream(
//         {
//           folder: "sales/paymentProofs",
//           use_filename: true,
//           unique_filename: false,
//         },
//         async (error, result) => {
//           if (error)
//             return res
//               .status(500)
//               .json({ success: false, message: error.message });

//           paymentProofUrl = result.secure_url;

//           const newSale = new Sales({
//             customer,
//             service,
//             saleItems: JSON.parse(saleItems),
//             paymentProof: paymentProofUrl,
//             paymentMethod,
//             assignedEmployee,
//             totalAmount: totalAmountPrice,
//             status,
//           });

//           await newSale.save();

//           res.status(200).json({
//             success: true,
//             message: "Sale Created Successfully",
//             data: newSale,
//           });
//         }
//       );
//       uploadedImage.end(req.file.buffer);
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, message: "No file uploaded" });
//     }
//   } catch (err) {
//     console.log("ERROR !", err);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

const createSale1 = async (req, res) => {
  try {
    const {
      customer,
      service,
      saleItems,
      paymentMethod,
      assignedEmployee,
      status,
      createdAt,
    } = req.body;

    const parsedSaleItems = JSON.parse(saleItems);
    const totalAmountPrice = parsedSaleItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // ⬇️ Step 1: Upload image(s) to Cloudinary
    let uploadedImageUrls = [];

    if (req.files?.paymentProof?.length > 0) {
      uploadedImageUrls = await Promise.all(
        req.files.paymentProof.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname, "image")
        )
      );
    }
    console.log(
      "Frontend Data :",
      customer,
      service,
      saleItems,
      paymentMethod,
      assignedEmployee,
      status,
      createdAt
    );

    const uniquePaymentMethods = [
      ...new Set(
        parsedSaleItems.flatMap((item) =>
          item.devices.map((device) => device.paymentMethod)
        )
      ),
    ];

    const newSale = new Sales({
      customer,
      service,
      saleItems: parsedSaleItems,
      paymentMethod: uniquePaymentMethods.join(" / "),
      assignedEmployee,
      totalAmount: totalAmountPrice,
      status,
      paymentProof: uploadedImageUrls.map((url) => ({
        url,
        date: new Date(),
        method: paymentMethod || "Unknown",
      })),
      createdAt: createdAt ? createdAt : Date.now(),
    });

    await newSale.save();

    // Populate assignedEmployee to get name
    await newSale.populate({
      path: "assignedEmployee",
      select: "name email phone team",
    });

    const io = req.app.get("io");

    io.emit("new-sale", {
      message: "A new sale has been created!",
      saleId: newSale._id,
      assignedEmployee: {
        id: newSale.assignedEmployee._id,
        name: newSale.assignedEmployee.name,
        email: newSale.assignedEmployee.email,
        phone: newSale.assignedEmployee.phone,
        team: newSale.assignedEmployee.team,
      },
    });

    res.status(200).json({
      success: true,
      message: "Sale Created Successfully",
      data: newSale,
    });
  } catch (err) {
    console.error("Create Sale Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createSale = async (req, res) => {
  try {
    const {
      customer,
      service,
      saleItems,
      assignedEmployee,
      status,
      createdAt,
    } = req.body;

    const parsedSaleItems =
      typeof saleItems === "string" ? JSON.parse(saleItems) : saleItems;

    const totalAmountPrice = parsedSaleItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // ⬇️ Step 1: Upload image(s) to Cloudinary
    let uploadedImageUrls = [];

    if (req.files?.paymentProof?.length > 0) {
      uploadedImageUrls = await Promise.all(
        req.files.paymentProof.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname, "image")
        )
      );
    }

    console.log(
      "Frontend Data:",
      customer,
      service,
      saleItems,
      assignedEmployee,
      status,
      createdAt
    );

    // ✅ Extract unique payment methods from saleItems > devices
    const allPaymentMethods = parsedSaleItems.flatMap((item) =>
      item.devices.map((device) => device.paymentMethod)
    );

    const uniquePaymentMethods = [...new Set(allPaymentMethods)];

    // ✅ Create structured paymentProof array
    const structuredPaymentProof = uploadedImageUrls.map((url, index) => ({
      url,
      date: new Date(),
      method:
        uniquePaymentMethods[index] || uniquePaymentMethods[0] || "Unknown",
    }));

    const newSale = new Sales({
      customer,
      service,
      saleItems: parsedSaleItems,
      paymentMethod: uniquePaymentMethods.join(" / "),
      assignedEmployee,
      totalAmount: totalAmountPrice,
      status,
      paymentProof: structuredPaymentProof,
      createdAt: createdAt ? createdAt : Date.now(),
    });

    await newSale.save();

    // Populate assignedEmployee to get name
    await newSale.populate({
      path: "assignedEmployee",
      select: "name email phone team",
    });

    const io = req.app.get("io");

    io.emit("new-sale", {
      message: "A new sale has been created!",
      saleId: newSale._id,
      assignedEmployee: {
        id: newSale.assignedEmployee._id,
        name: newSale.assignedEmployee.name,
        email: newSale.assignedEmployee.email,
        phone: newSale.assignedEmployee.phone,
        team: newSale.assignedEmployee.team,
      },
    });

    res.status(200).json({
      success: true,
      message: "Sale Created Successfully",
      data: newSale,
    });
  } catch (err) {
    console.error("Create Sale Error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllSale = async (req, res) => {
  try {
    const sales = await Sales.find()
      // .populate({
      //   path: "assignedEmployee",
      //   select: "_id name role team",
      //   populate: {
      //     path: "team",
      //     select: "_id name description",
      //   },
      // })
      .populate({
        path: "assignedEmployee",
        select: "_id name email role assignedService team",
        populate: [
          {
            path: "team",
            select: "_id name description",
          },
          {
            path: "assignedService",
            select: "_id name description",
          },
        ],
      })
      .populate({
        path: "customer",
      })
      .populate({
        path: "saleItems",
        // select: "_id name role"
      });
    res.status(200).json({
      success: true,
      message: `Sale retrived Successfully`,
      data: sales,
    });
  } catch (err) {
    console.log("ERROR !", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSaleByEmp = async (req, res) => {
  try {
    const empId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await Sales.countDocuments({ assignedEmployee: empId });

    const services = await Sales.find({ assignedEmployee: empId })
      .populate({
        path: "customer",
        select: "_id name email phone whatsapp address team",
      })
      .populate("service")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!services) {
      return res.status(404).json({
        success: false,
        message: "No services found for this employee",
      });
    }

    res.status(200).json({
      success: true,
      message: "All Services retrieved Based on Employee successfully",
      data: services,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

const getSalesByEmployeeAndDateRange1 = async (req, res) => {
  try {
    const { dateRange } = req.body;
    const empId = req.params.id;
    console.log("Employee ID :", empId);
    console.log("dateRange  :", dateRange);

    if (!empId || !Array.isArray(dateRange) || dateRange.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "employeeId and valid dateRange are required",
      });
    }

    const [startDate, endDate] = dateRange;

    const sales = await Sales.find({
      assignedEmployee: empId,
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate({
        path: "assignedEmployee",
        select: "_id name role team",
        populate: {
          path: "team",
          select: "_id name description",
        },
      })
      .populate({
        path: "customer",
        // select: "_id name role"
      })
      .populate({
        path: "saleItems",
        // select: "_id name role"
      });

    res.status(200).json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSalesByEmployeeAndDateRange = async (req, res) => {
  try {
    const { dateRange } = req.body;
    const empId = req.params.id;

    console.log("Employee ID:", empId);
    console.log("Date Range:", dateRange);

    if (!empId || !Array.isArray(dateRange) || dateRange.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "employeeId and valid dateRange are required",
      });
    }

    // Normalize start and end of date
    const [startDateRaw, endDateRaw] = dateRange;
    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const sales = await Sales.find({
      assignedEmployee: new mongoose.Types.ObjectId(empId),
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate({
        path: "assignedEmployee",
        select: "_id name role team",
        populate: {
          path: "team",
          select: "_id name description",
        },
      })
      .populate("customer")
      .populate("saleItems");

    res.status(200).json({
      success: true,
      message: "Sales fetched successfully",
      data: sales,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getSalesByTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId?.trim();
    const companyId = req.params.companyId?.trim();
    console.log("company :", companyId);
    console.log("teamId :", teamId);

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Team ID",
      });
    }

    const teamObjectId = new mongoose.Types.ObjectId(String(teamId));
    const companyObjectId = new mongoose.Types.ObjectId(String(companyId));

    const allAgents = await User.find({ role: "sales_agent" });
    console.log("All employee", allAgents);

    // const teamAgents = allAgents.filter((user) =>
    //   user.team?.equals(teamObjectId)
    // );

    const teamAgents = allAgents.filter(
      (user) =>
        user.team?.equals(teamObjectId) &&
        user.assignedService?.equals(companyObjectId)
    );

    const userIds = teamAgents.map((user) => user._id);

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found in this team",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: 1,
          totalPages: 0,
          perPage: 10,
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const preCount = await Sales.countDocuments({
      assignedEmployee: { $in: userIds },
    });

    const pipeline = [
      {
        $match: {
          assignedEmployee: { $in: userIds },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "assignedEmployee",
          foreignField: "_id",
          as: "assignedEmployee",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "assignedEmployee.team",
          foreignField: "_id",
          as: "assignedEmployee.team",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee.team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Sales.aggregate(pipeline);
    // console.log("Aggregated Sales Result:", result);

    const teamSales = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    if (teamSales.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No sales found for this team",
        data: [],
        pagination: {
          totalItems: 0,
          currentPage: page,
          totalPages: 0,
          perPage: limit,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sales retrieved based on team successfully",
      data: teamSales,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Internal Server Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getTeamPendingSale = async (req, res) => {
  try {
    const teamId = req.params.id?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const allActivations = await Sales.find()
      .populate("customer")
      .populate("assignedEmployee");

    const filtered = allActivations.filter(
      (activation) =>
        activation.assignedEmployee?.team?._id?.toString() === teamId &&
        activation.activation === "pending"
    );

    // const total = filtered.length;

    // const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      message: "Filtered activations retrieved",
      data: filtered,
      pagination: {
        totalItems: filtered.length,
      },
    });
  } catch (err) {
    console.error("Error fetching activations:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateSale1 = async (req, res) => {
  try {
    const saleId = req.params.id;
    const updateData = req.body;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    if (req.files && req.files.length > 0) {
      const deletePromises = (sale.paymentProof || []).map((url) => {
        const parts = url.split("/");
        console.log("delete file path :", parts);
        const fileName = parts[parts.length - 1].split(".")[0];
        const publicId = `sales/paymentProofs/${fileName}`;
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);

      const uploadBufferToCloudinary = (buffer, originalname) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "sales/paymentProofs",
              use_filename: true,
              public_id: originalname.split(".")[0],
              unique_filename: false,
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          stream.end(buffer);
        });
      };

      const uploadedUrls = await Promise.all(
        req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname)
        )
      );

      updateData.paymentProof = uploadedUrls;
    }

    const updatedSale = await Sales.findByIdAndUpdate(saleId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale,
    });
  } catch (err) {
    console.error("Update Sale Error:", err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

const updateSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const updateData = req.body;

    const sale = await Sales.findById(saleId);
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // ✅ Always parse saleItems
    const parsedSaleItems =
      typeof req.body.saleItems === "string"
        ? JSON.parse(req.body.saleItems)
        : req.body.saleItems;

    updateData.saleItems = parsedSaleItems;

    // Step 1: Handle Image File Upload (paymentProof)
    if (req.files?.paymentProof?.length > 0) {
      // const deletePromises = (sale.paymentProof || []).map((url) => {
      //   const parts = url.split("/");
      //   const fileName = parts[parts.length - 1].split(".")[0];
      //   const publicId = `sales/paymentProofs/${fileName}`;
      //   return cloudinary.uploader.destroy(publicId);
      // });
      // await Promise.all(deletePromises);

      const uploadedImageUrls = await Promise.all(
        req.files.paymentProof.map((file) =>
          uploadBufferToCloudinary(file.buffer, file.originalname, "image")
        )
      );
      const newPaymentProofs = uploadedImageUrls.map((url) => ({
        url,
        date: new Date(),
        method: updateData.paymentMethod?.split(" / ")[0] || "Unknown",
      }));

      updateData.paymentProof = [
        ...(sale.paymentProof || []),
        ...newPaymentProofs,
      ];
    }

    // Step 2: Handle Audio File Upload (voiceNote)
    if (req.files?.voiceProof?.length > 0) {
      const audioFile = req.files.voiceProof[0];

      const uploadedAudioUrl = await uploadBufferToCloudinary(
        audioFile.buffer,
        audioFile.originalname,
        "audio"
      );

      updateData.voiceProof = uploadedAudioUrl;
    }
    // const parsedSaleItem = JSON.parse(saleItems);
    const totalAmountPrice = parsedSaleItems?.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    console.log("Reduced Amount :", totalAmountPrice);
    updateData.totalAmount = totalAmountPrice;

    // Payment Method Update by device
    const uniquePaymentMethods = [
      ...new Set(
        updateData?.saleItems?.flatMap((item) =>
          item.devices.map((d) => d.paymentMethod)
        )
      ),
    ];
    updateData.paymentMethod = uniquePaymentMethods.join(" / ");

    const updatedSale = await Sales.findByIdAndUpdate(saleId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      data: updatedSale,
    });
  } catch (err) {
    console.error("Update Sale Error:", err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

// Upload function supporting both image & audio
const uploadBufferToCloudinary = (buffer, originalname, type = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: type === "audio" ? "sales/voiceNotes" : "sales/paymentProofs",
        use_filename: true,
        public_id: originalname.split(".")[0].trim(),
        unique_filename: false,
        resource_type: type === "audio" ? "video" : "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// const updateSale = async (req, res) => {
//   try {
//     const saleId = req.params.id;
//     const updateData = req.body;
//     const sale = await Sales.find({ saleId });

//     if (!sale) {
//       return res.status(404).json({
//         success: false,
//         message: `Sale not found`,
//       });
//     }

//     const updateSale = await Sales.findByIdAndUpdate(saleId, updateData, {
//       new: true,
//       runValidators: true,
//     });
//     res.status(200).json({
//       success: true,
//       message: "Sale update successfully",
//       data: updateSale,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: `Error! ${err.message}`,
//     });
//   }
// };

const getUnactivatedSalesByTeam1 = async (req, res) => {
  try {
    const teamId = req.params.teamId;

    const activatedSales = await SaleActivation.find({}, "sale");
    const activatedSaleIds = activatedSales.map((act) => act.sale.toString());

    const unactivatedSales = await Sales.find()
      .populate({
        path: "assignedEmployee",
        select: "name email team",
        populate: {
          path: "team",
          select: "_id name",
        },
      })
      .populate("customer")
      .where("assignedEmployee.team")
      .equals(teamId)
      .where("_id")
      .nin(activatedSaleIds);

    res.status(200).json({
      success: true,
      message: "Sales not in SaleActivation for given team",
      data: unactivatedSales,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUnactivatedSalesByTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId; // keep it as a string for comparison
    const companyId = req.params.companyId; // keep it as a string for comparison

    console.log("Team id active :", teamId);
    console.log("Company id active :", companyId);

    // 1. Get all SaleActivation records to exclude activated sales
    const activatedSales = await SaleActivation.find({}, "sale");
    const activatedSaleIds = activatedSales.map((act) => act.sale.toString());

    // 2. Get all sales with necessary fields populated
    const allSales = await Sales.find()
      .populate({
        path: "assignedEmployee",
        select: "name email team assignedService",
        populate: {
          path: "team",
          select: "_id name",
        },
      })
      .populate("customer");

    // 3. Filter sales based on team and activation/device logic
    const filteredSales = allSales.filter((sale) => {
      const teamObjId = sale?.assignedEmployee?.team?._id;
      const companyObjId = sale?.assignedEmployee?.assignedService;
      const teamMatch =
        teamObjId &&
        companyObjId &&
        teamObjId.toString() === teamId &&
        companyObjId.toString() === companyId;
      console.log("----------COMPANY :", sale?.assignedEmployee);

      const hasNewDevice = sale.saleItems?.some((item) =>
        item.devices?.some((device) => device?.new === true)
      );

      const isUnactivated = !activatedSaleIds.includes(sale._id.toString());

      // console.log({
      //   saleId: sale._id.toString(),
      //   teamObjId: teamObjId?.toString(),
      //   teamId,
      //   teamMatch,
      //   hasNewDevice,
      //   isUnactivated,
      //   finalIncluded: teamMatch && (isUnactivated || hasNewDevice),
      // });

      return teamMatch && (isUnactivated || hasNewDevice);
    });

    res.status(200).json({
      success: true,
      message: "Sales with no activation or with new device(s)",
      data: filteredSales,
    });
  } catch (err) {
    console.error("Error in getUnactivatedSalesByTeam:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;
    const deleteActivation = await SaleActivation.deleteMany({ sale: saleId });
    const deletedSale = await Sales.findByIdAndDelete(saleId);
    const response = [deleteActivation, deletedSale];

    res.status(200).json({
      success: true,
      message: "Sale & Activation delete successfully",
      data: response,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: `Error! ${err.message}`,
    });
  }
};

const searchSalesByPhone = async (req, res) => {
  try {
    const number = req.query.number?.trim();
    const page = parseInt(req.query.page) || 1;
    const emp = req.query.emp || "";
    console.log("***************** ", emp, "*******************");
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Search number is required",
      });
    }

    const pipeline = [
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { "customer.phone": { $regex: number, $options: "i" } },
            { "customer.name": { $regex: number, $options: "i" } },
            { "customer.email": { $regex: number, $options: "i" } },
          ],
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "assignedEmployee",
          foreignField: "_id",
          as: "assignedEmployee",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "assignedEmployee.team",
          foreignField: "_id",
          as: "assignedEmployee.team",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee.team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Sales.aggregate(pipeline);
    const sales = result[0]?.data.filter(
      (sale) => sale.assignedEmployee._id == emp
    );
    // console.log("Sale Filter:", sales)
    // console.log("Sale :", result[0].data)

    const total = sales.length;

    return res.status(200).json({
      success: true,
      message: "Sales matched by phone number",
      data: sales,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error searching sales by phone:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const searchAllSalesByPhone = async (req, res) => {
  try {
    const number = req.query.number?.trim();
    const page = parseInt(req.query.page) || 1;
    // const emp = req.query.emp || '';
    // console.log("***************** ", emp, "*******************")
    const limit = 10;
    const skip = (page - 1) * limit;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Search number is required",
      });
    }

    const pipeline = [
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { "customer.phone": { $regex: number, $options: "i" } },
            { "customer.name": { $regex: number, $options: "i" } },
            { "customer.email": { $regex: number, $options: "i" } },
          ],
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "assignedEmployee",
          foreignField: "_id",
          as: "assignedEmployee",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "assignedEmployee.team",
          foreignField: "_id",
          as: "assignedEmployee.team",
        },
      },
      {
        $unwind: {
          path: "$assignedEmployee.team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Sales.aggregate(pipeline);
    const sales = result[0]?.data;
    // console.log("Sale Filter:", sales)
    // console.log("Sale :", result[0].data)

    const total = sales.length;

    return res.status(200).json({
      success: true,
      message: "Sales matched by phone number",
      data: sales,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        perPage: limit,
      },
    });
  } catch (err) {
    console.error("Error searching sales by phone:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const renewSale = async (req, res) => {
  const { id } = req.params;
  const {
    saleItemIndex,
    deviceIndex,
    device, // deviceType
    createdAt, // renewal date
    customPrice,
    month,
    paymentMethod,
    renewedBy, // just the user ID
  } = req.body;

  console.log("📩 Request Received to Renew Device");
  console.log("🆔 Sale ID:", id);
  console.log("📊 Payload:", {
    saleItemIndex,
    deviceIndex,
    device,
    createdAt,
    customPrice,
    month,
    paymentMethod,
    renewedBy,
  });

  try {
    const sale = await Sales.findById(id);
    if (!sale) {
      console.error("❌ Sale not found");
      return res.status(404).json({ message: "Sale not found" });
    }

    const saleItem = sale.saleItems[saleItemIndex];
    if (!saleItem) {
      console.error("❌ Invalid saleItemIndex");
      return res.status(400).json({ message: "Invalid saleItemIndex" });
    }

    console.log("🧾 Found SaleItem:", saleItem);

    const targetDevice = saleItem.devices[deviceIndex];
    console.log("🎯 Target Device:", targetDevice);

    if (!targetDevice) {
      console.error("❌ Device not found at given index");
      return res
        .status(400)
        .json({ message: "Device not found at given index" });
    }

    console.log(
      `🔍 Comparing deviceType: "${targetDevice.deviceType}" with input: "${device}"`
    );

    // if (
    //   targetDevice.deviceType.trim().toLowerCase() !==
    //   device.trim().toLowerCase()
    // ) {
    //   console.error("❌ Device type mismatch");
    //   return res.status(400).json({
    //     message: "Device type mismatch",
    //     expected: targetDevice.deviceType,
    //     got: device,
    //   });
    // }

    const user = await User.findById(renewedBy).select("name");
    if (!user) {
      console.error("❌ Renewing user not found");
      return res.status(404).json({ message: "Renewing user not found" });
    }

    console.log("👤 Renewed By:", user.name);

    const logEntry = {
      previousData: {
        customPrice: targetDevice.customPrice,
        month: targetDevice.month,
        paymentMethod: targetDevice.paymentMethod,
        updatedAt: new Date(targetDevice.createdAt || Date.now()),
      },
      renewedBy: {
        _id: renewedBy,
        name: user.name,
      },
      renewedAt: new Date(createdAt),
    };

    console.log("📘 Log Entry Prepared:", logEntry);

    const activation = await SaleActivation.findOne({
      sale: id,
    });

    if (
      activation &&
      activation.deviceInfo.deviceType.trim().toLowerCase() ===
        targetDevice.deviceType.trim().toLowerCase()
    ) {
      activation.currentMonth = 999;
      const deviceInfoUpdated = {
        deviceType: device,
        customPrice: customPrice,
        plan: activation.deviceInfo.plan,
        totalMonths: month,
      };
      activation.deviceInfo = deviceInfoUpdated;
      activation.status = "pending";
      activation.markModified("deviceInfo");
      await activation.save();

      // Update device
      targetDevice.deviceType = device;
      targetDevice.customPrice = customPrice;
      targetDevice.month = month;
      targetDevice.paymentMethod = paymentMethod;
      targetDevice.createdAt = new Date(createdAt);

      // Update sale date because it renew the sale so it count this month sale
      sale.createdAt = new Date();

      // Push log
      sale.logs.push(logEntry);
      await sale.save();
      console.log("💾 Sale updated and log pushed");

      console.log("✅ Activation matched and updated");
    } else {
      console.warn("⚠️ Activation not found or device type mismatch");
    }

    console.log("⚡ Activation Updated:", activation);

    return res.status(200).json({
      message: "Device renewed, log stored, and activation updated.",
      updatedSale: sale,
      updatedActivation: activation,
    });
  } catch (err) {
    console.error("🔥 Server Error in Renew:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// const sendEmail = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const file = req.file;

//     if (!email || !file) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Email and file are required" });
//     }

//     // Nodemailer setup
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//       },
//     });

//     await transporter.sendMail({
//       from: `"Your Company" <${process.env.SMTP_USER}>`,
//       to: email,
//       subject: "Your Invoice",
//       text: "Please find attached your invoice.",
//       attachments: [
//         {
//           filename: file.originalname,
//           content: file.buffer,
//         },
//       ],
//     });

//     res.json({ success: true, message: "Invoice sent!" });
//   } catch (err) {
//     console.error("Mail error:", err);
//     res.status(500).json({ success: false, message: "Failed to send invoice" });
//   }
// };

const sendEmailOLD = async (req, res) => {
  try {
    const { email } = req.body;
    const file = req.file;

    if (!email || !file) {
      return res
        .status(400)
        .json({ success: false, message: "Email and file are required" });
    }

    // Use explicit host/port for more predictable results (Gmail SMTP example)
    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: false, // use TLS with port 587
      auth: {
        user: "invoice@deemandtv.com",
        pass: "Adzdrio@321", // App Password for Gmail
      },
    });

    // Optional: verify connection configuration (good for debugging)
    try {
      await transporter.verify();
      console.log("SMTP transporter verified");
    } catch (verifyErr) {
      console.warn("SMTP transporter verification failed:", verifyErr);
      // continue — verification failure often indicates auth issue or network
    }

    const mailOptions = {
      from: `"Yahu Baba" <lk8218299028@gmail.com>`,
      to: email,
      subject: "Your Invoice",
      text: "Please find attached your invoice.",
      // attachments: [
      //   {
      //     filename: file.originalname || "invoice.pdf",
      //     content: file.buffer,
      //   },
      // ],
    };

    const info = await transporter.sendMail(mailOptions);
    // Log the full info object (contains messageId, accepted, rejected, response)
    console.log("sendMail info:", info);

    // Helpful checks:
    // - info.accepted: array of recipients accepted by the SMTP server
    // - info.rejected: array of recipients rejected by the SMTP server
    // - info.response: server response message

    if (Array.isArray(info.rejected) && info.rejected.length > 0) {
      console.warn("Some recipients were rejected:", info.rejected);
      return res.status(502).json({
        success: false,
        message: "Recipient rejected by SMTP server",
        info,
      });
    }

    return res.json({ success: true, message: "Invoice sent!", info });
  } catch (err) {
    console.error("Mail error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send invoice",
      error: err.message,
    });
  }
};

const sendEmail = async (req, res) => {
  try {
    const { name, email, company, plan, month, amount, invoiceNumber,  } = req.body;
    const file = req.file;

    if (!email || !company || !file) {
      return res.status(400).json({
        success: false,
        message: "Email & Company Name & file are required",
      });
    }

    // Hostinger SMTP (port 465 uses SSL -> secure: true)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: process.env.SMTP_PORT || 465,
      secure: true, // true for 465 (SSL)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    try {
      await transporter.verify();
      console.log("SMTP transporter verified");
    } catch (verifyErr) {
      console.warn(
        "SMTP transporter verify failed:",
        verifyErr && verifyErr.message ? verifyErr.message : verifyErr
      );
    }
    const html = `
<!-- Preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
  Your ${company} subscription invoice — ${invoiceNumber}
</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f6f7fb;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eaeaf1;">
        <!-- Header -->
        <tr>
          <td style="background:#111827;padding:20px 24px;">
            <table role="presentation" width="100%">
              <tr>
                <td align="left" style="vertical-align:middle;">
                  <img src="https://res.cloudinary.com/dxziqnbub/image/upload/v1755938518/deemanTv_logo-removebg-preview_tdutzp.png" alt="${company} logo" width="140" style="display:block;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;">
                </td>
                <td align="right" style="vertical-align:middle;">
                  <div style="font:600 14px/1.4 Arial,Helvetica,sans-serif;color:#e5e7eb;">${company}</div>
                  <div style="font:400 12px/1.4 Arial,Helvetica,sans-serif;color:#9ca3af;">Invoice • ${invoiceNumber}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:28px 24px 8px 24px;">
            <div style="font:700 20px/1.3 Arial,Helvetica,sans-serif;color:#111827;">Dear ${name},</div>
            <div style="height:8px;"></div>
            <div style="font:400 14px/1.7 Arial,Helvetica,sans-serif;color:#374151;">
              Thank you for choosing <strong>${company}</strong>. Below are your subscription details and invoice summary.
            </div>
          </td>
        </tr>

        <!-- Plan Details -->
        <tr>
          <td style="padding:12px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eaeaf1;border-radius:10px;overflow:hidden;">
              <tr>
                <td colspan="2" style="background:#f3f4f6;padding:12px 16px;font:600 14px Arial,Helvetica,sans-serif;color:#111827;">Subscription Details</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font:400 13px Arial,Helvetica,sans-serif;color:#4b5563;width:40%;">Plan</td>
                <td style="padding:10px 16px;font:600 13px Arial,Helvetica,sans-serif;color:#111827;">${plan}</td>
              </tr>
              <tr style="background:#fafafa;">
                <td style="padding:10px 16px;font:400 13px Arial,Helvetica,sans-serif;color:#4b5563;">Duration</td>
                <td style="padding:10px 16px;font:600 13px Arial,Helvetica,sans-serif;color:#111827;">${month} month(s)</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font:700 13px Arial,Helvetica,sans-serif;color:#111827;border-top:1px solid #eaeaf1;">Total Amount</td>
                <td style="padding:12px 16px;font:700 16px Arial,Helvetica,sans-serif;color:#111827;border-top:1px solid #eaeaf1;">${amount}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:8px 24px 4px 24px;">
           
            <div style="clear:both;height:10px;"></div>
            <div style="font:400 12px/1.7 Arial,Helvetica,sans-serif;color:#6b7280;">
              Your invoice is also attached for your records. If you have any questions about your subscription, we’re happy to help.
            </div>
          </td>
        </tr>

        <!-- Extra touch -->
        <tr>
          <td style="padding:8px 24px 20px 24px;">
            <div style="background:#f9fafb;border:1px solid #eef0f4;border-radius:10px;padding:12px 14px;">
              <div style="font:600 13px Arial,Helvetica,sans-serif;color:#111827;margin-bottom:4px;">A little extra from us</div>
              <div style="font:400 12px/1.7 Arial,Helvetica,sans-serif;color:#4b5563;">
                We’re constantly enhancing your experience with fresh, high-quality digital entertainment. 
                Thank you for being part of ${company}.
              </div>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#111827;color:#d1d5db;padding:14px 24px;">
            <table role="presentation" width="100%">
              <tr>
                <td align="left" style="font:400 12px Arial,Helvetica,sans-serif;">
                  © ${new Date().getFullYear()} ${company}. All rights reserved.
                </td>
                <td align="right" style="font:400 12px Arial,Helvetica,sans-serif;">
                  <a href="mailto:${process.env.SMTP_USER}" style="color:#d1d5db;text-decoration:none;">${process.env.SMTP_USER}</a> &nbsp;|&nbsp; 
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <div style="height:24px;"></div>
      <!-- Unsubscribe (helps deliverability) -->
      <div style="font:400 11px Arial,Helvetica,sans-serif;color:#6b7280;">
        To manage notifications, reply to this email or visit your account settings.
      </div>
    </td>
  </tr>
</table>
`;

    const mailOptions = {
      from: `"${company || "DeemandTv"}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your ${company || "DeemandTv"} Subscription Invoice`,
      html,
      headers: {
        // Helps inboxing on Gmail/Yahoo/Outlook
        "List-Unsubscribe": `<mailto:${process.env.SMTP_USER}>`,
      },
      attachments: [
        {
          filename: file.originalname || "invoice.pdf",
          content: file.buffer,
          contentType: file.mimetype || "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("sendMail info:", info);

    if (Array.isArray(info.rejected) && info.rejected.length > 0) {
      console.warn("Some recipients were rejected:", info.rejected);
      return res.status(502).json({
        success: false,
        message: "Recipient rejected by SMTP server",
        info,
      });
    }

    return res.json({ success: true, message: "Invoice sent!", info });
  } catch (err) {
    console.error("Mail error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send invoice",
      error: err.message || err,
    });
  }
};

module.exports = {
  createSale,
  getAllSale,
  getSaleByEmp,
  getTeamPendingSale,
  getUnactivatedSalesByTeam,
  getSalesByEmployeeAndDateRange,
  searchSalesByPhone,
  searchAllSalesByPhone,
  updateSale,
  deleteSale,
  getSalesByTeam,
  renewSale,
  sendEmail,
};
