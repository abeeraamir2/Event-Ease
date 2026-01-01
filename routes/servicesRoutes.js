const express = require("express");
const router = express.Router();
const Service = require("../models/serviceModel");
const authMiddleware = require("../middleware/authMiddleware");

// ADD NEW SERVICE (VENDOR ONLY)
router.post(
  "/add",
  authMiddleware(["vendor"]),
  async (req, res) => {
    try {
      const vendorId = req.user.id; 
      const { name, location, category, description, categoryDetails, status } = req.body;

      if (!name || !location || !category) {
        return res.status(400).json({
          message: "Name, location and category are required"
        });
      }

      const validCategories = ["venue", "catering", "decor", "photographer"];
      const categoryLower = category.toLowerCase();

      if (!validCategories.includes(categoryLower)) {
        return res.status(400).json({
          message: "Invalid category"
        });
      }

      const service = new Service({
        vendorId,
        name,
        location,
        category: categoryLower,
        description: description || "",
        categoryDetails: categoryDetails || {},
        status: status || "active"
      });
  

      await service.save();

      res.status(201).json({
        message: "Service added successfully",
        updatedServices
      });

    } catch (err) {6
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// GET SERVICES OF LOGGED-IN VENDOR (VENDOR ONLY)
router.get(
  "/vendor/:vendorId",
  authMiddleware(["vendor"]),
  async (req, res) => {
    try {
      // AUTHORIZATION CHECK
      if (req.params.vendorId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      const services = await Service.find({ vendorId: req.user.id })
        .sort({ createdAt: -1 })
        .lean();
      console.log(services);
      res.status(200).json(services);

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);



// TOGGLE SERVICE STATUS (VENDOR ONLY)
router.put(
  "/:id/status",
  authMiddleware(["vendor"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // OWNERSHIP CHECK
      if (service.vendorId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      service.status = status;
      await service.save();

      res.status(200).json({
        message: "Status updated successfully",
        service
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


// UPDATE SERVICE (VENDOR ONLY)
router.put(
  "/:id",
  authMiddleware(["vendor"]),
  async (req, res) => {
    try {
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (service.vendorId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const { name, category, location, description, categoryDetails } = req.body;

      if (name) service.name = name;
      if (location) service.location = location;
      if (description !== undefined) service.description = description;
      if (category) service.category = category.toLowerCase();
      if (categoryDetails) service.categoryDetails = categoryDetails;

      await service.save();

      res.status(200).json({
        message: "Service updated successfully",
        service
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
); 

// DELETE SERVICE (VENDOR ONLY)
router.delete(
  "/:id",
  authMiddleware(["vendor"]),
  async (req, res) => {
    try {
      req.params.id = "692fe489919f3b3c5c531f79";
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      if (service.vendorId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await service.deleteOne();

      res.status(200).json({ message: "Service deleted successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

//PUBLIC ROUTES (CUSTOMERS)
// Get all active services
router.get("/", async (req, res) => {
  try {
    const services = await Service.find({ status: "active" })
      .populate("vendorId", "name contact location")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(services);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get services by category
router.get("/category/:category", async (req, res) => {
  try {
    const services = await Service.find({
      category: req.params.category.toLowerCase(),
      status: "active"
    })
      .populate("vendorId", "name contact location")
      .lean();

    res.status(200).json(services);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single service
router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate("vendorId", "name email contact location")
      .lean();

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json(service);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
