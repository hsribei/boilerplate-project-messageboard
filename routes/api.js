/*
*
*
*       Complete the API routing below
*
*
*/

"use strict";

const ObjectId = require("mongodb").ObjectID;
const { Thread, Reply } = require("../models");

module.exports = function(app) {
  app
    .route("/api/threads/:board")
    .post(async (req, res) => {
      const newThread = {
        board: req.params.board,
        text: req.body.text,
        delete_password: req.body.delete_password
      };
      const savedThread = await Thread.create(newThread);
      res.json(savedThread);
    })
    .get(async (req, res) => {
      const recentThreads = await Thread.find({})
        .limit(10)
        .sort({ bumped_on: -1 })
        .slice("replies", 3)
        .select({
          reported: false,
          delete_password: false,
          "replies.reported": false,
          "replies.delete_password": false
        });
      res.json(recentThreads);
    });

  app
    .route("/api/replies/:board")
    .post(async (req, res) => {
      const newReply = Object.assign({}, req.body, {
        thread_id: new ObjectId(req.body.thread_id)
      });
      const thread = await Thread.findById(newReply.thread_id);
      thread.replies.unshift(newReply);
      await thread.save();
      res.json(thread);
    })
    .get(async (req, res) => {
      const thread = await Thread.findById(
        new ObjectId(req.query.thread_id)
      ).select({
        reported: false,
        delete_password: false,
        "replies.reported": false,
        "replies.delete_password": false
      });
      res.json(thread);
    });
};
