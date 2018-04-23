/*
*
*
*       Complete the API routing below
*
*
*/

"use strict";

const { Thread, Reply } = require("../models");

module.exports = function(app) {
  app.route("/api/threads/:board").post(async (req, res) => {
    const newThread = {
      board: req.params.board,
      text: req.body.text,
      delete_password: req.body.delete_password
    };
    const savedThread = await Thread.create(newThread);
    res.json(savedThread);
  });

  app.route("/api/replies/:board");
};
