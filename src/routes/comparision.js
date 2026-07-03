const express = require("express");

const comparisionRouter = express.Router();

const { userAuth } =require("../middlewares/auth");

const {

    compareVideosController,

    getHistory,

    getSingleComparison,

    deleteComparison,

} = require(
    "../controllers/comparisonController"
);

comparisionRouter.post(
    "/comparision",
    userAuth,
    compareVideosController
);

comparisionRouter.get(
    "/history",
    userAuth,
    getHistory
);

comparisionRouter.get(
    "/history/:id",
    userAuth,
    getSingleComparison
);

comparisionRouter.delete(
    "/history/:id",
    userAuth,
    deleteComparison
);

module.exports = comparisionRouter;