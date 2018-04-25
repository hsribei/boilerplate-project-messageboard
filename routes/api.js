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
      const recentThreads = await Thread.aggregate([
        { $match: { board: req.params.board } },
        { $sort: { bumped_on: -1 } },
        { $limit: 10 },
        {
          $project: {
            reported: false,
            delete_password: false,
            "replies.reported": false,
            "replies.delete_password": false
          }
        },
        {
          $project: {
            replies: { $slice: ["$replies", 3] },
            replycount: { $size: "$replies" }
          }
        }
      ]);
      res.json(recentThreads);
    })
    .delete(async (req, res) => {
      const thread = await Thread.findById(req.body.thread_id);
      if (req.body.delete_password === thread.delete_password) {
        await Thread.remove({ _id: req.body.thread_id });
        res.send("success");
      } else {
        res.status(403).send("incorrect password");
      }
    })
    .put(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (thread) {
          thread.reported = true;
          await thread.save();
          res.send("success");
        } else {
          res.sendStatus(404);
        }
      } catch (e) {
        res.status(500).send(e.toString());
      }
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
      if (thread) {
        res.json(thread);
      } else {
        res.sendStatus(404);
      }
    })
    .put(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (thread) {
          const reply = thread.replies.id(req.body.reply_id);
          if (reply) {
            reply.reported = true;
            await thread.save();
            res.send("success");
          } else {
            res.status(404).send("reply_id not found");
          }
        } else {
          res.status(404).send("thread_id not found");
        }
      } catch (e) {
        res.status(500).send(e.toString());
      }
    })
    .delete(async (req, res) => {
      try {
        const thread = await Thread.findById(req.body.thread_id);
        if (thread) {
          const reply = thread.replies.id(req.body.reply_id);
          if (reply) {
            if (req.body.delete_password === reply.delete_password) {
              reply.remove();
              await thread.save();
              res.send("success");
            } else {
              res.status(403).send("incorrect password");
            }
          } else {
            res.status(404).send("reply_id not found");
          }
        } else {
          res.status(404).send("thread_id not found");
        }
      } catch (e) {
        res.status(500).send(e.toString());
      }
    });
};
