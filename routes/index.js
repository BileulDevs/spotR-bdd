const express = require("express");
const router = express.Router();
const metricsRouter = require("./metrics.route")
const usersRouter = require("./users.route")

router.use("/metrics", metricsRouter);
router.use("/users", usersRouter);

module.exports = router;