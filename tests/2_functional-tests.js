/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require("chai-http");
const chai = require("chai");
const _ = require("lodash");
const fp = require("lodash/fp");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

const newAsFn = type => (...args) => new type(...args);
const isDateFromString = fp.compose(_.isDate, newAsFn(Date));

function dot(property) {
  return obj => obj[property];
}

suite("Functional Tests", function() {
  this.timeout(10000);
  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("Create valid thread and typecheck result", async function() {
        const board = "test";
        const text = "test";
        const delete_password = "test";
        const res = await chai
          .request(server)
          .post(`/api/threads/${board}`)
          .send({ text, delete_password });

        assert.strictEqual(res.status, 200);
        const savedThread = res.body;
        const fieldTypes = {
          _id: _.isString,
          text: _.isString,
          created_on: isDateFromString,
          bumped_on: isDateFromString,
          reported: _.isBoolean,
          delete_password: _.isString,
          replies: _.isArray
        };
        Object.keys(fieldTypes).forEach(field => {
          assert.property(savedThread, field);
          assert(fieldTypes[field](savedThread[field]));
        });
      });
    });

    suite("GET", function() {
      test("Create thread then GET board to confirm it's in the returned recent threads list", async function() {
        const board = "test";
        // POST
        const text = "test";
        const delete_password = "test";
        const postRes = await chai
          .request(server)
          .post(`/api/threads/${board}`)
          .send({ text, delete_password });

        const savedThread = postRes.body;

        // GET
        const getRes = await chai.request(server).get(`/api/threads/${board}`);

        assert.strictEqual(getRes.status, 200);

        const recentThreads = getRes.body;

        assert.isArray(recentThreads);
        assert.isNotEmpty(recentThreads);
        // Tests the sorting: savedThread is the last created, therefore
        // last bumped, so should come first
        assert.strictEqual(recentThreads[0]._id, savedThread._id);

        // `reported` and `delete_password` fields should not be returned
        recentThreads.forEach(thread =>
          assert.doesNotHaveAnyKeys(thread, ["reported", "delete_password"])
        );
      });

      test("Return 10 most recent threads", function() {
        const board = "test";
        // POST 15 threads
        const text = "test";
        const delete_password = "test";

        const requester = chai.request(server).keepOpen();

        const postRequests = _.range(15).map(() =>
          requester
            .post(`/api/threads/${board}`)
            .send({ text, delete_password })
        );

        return Promise.all(postRequests)
          .then(responses => {
            const savedThreads = fp.map(dot("body"))(responses);
            // Sort DESC by bumped_on date
            savedThreads.sort(
              (a, b) => new Date(b.bumped_on) - new Date(a.bumped_on)
            );

            const recentThreads = requester
              .get(`/api/threads/${board}`)
              .then(res => res.body);

            return Promise.all([savedThreads, recentThreads]);
          })
          .then(([savedThreads, recentThreads]) => {
            assert.lengthOf(savedThreads, 15);
            assert.lengthOf(recentThreads, 10);

            const first10SavedIds = savedThreads.slice(0, 10).map(dot("_id"));
            const recentIds = recentThreads.map(dot("_id"));

            // NOTE: Not using same *Ordered* Members because "bumped_on"
            // doesn't have enough resolution, and sometimes two entries have
            // the same exact timestamp, whereas recentIds uses ObjectIDs for
            // sorting and is always consistent with db insertion order (it
            // seems)
            assert.sameMembers(first10SavedIds, recentIds);

            requester.close();
          });
      });

      // test("Return only the most recent 3 replies", function() {
      // });
    });

    suite("DELETE", function() {});

    suite("PUT", function() {});
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("Create valid reply", async function() {
        const board = "test";
        const text = "test";
        const delete_password = "test";

        // First, create thread
        const threadPostRes = await chai
          .request(server)
          .post(`/api/threads/${board}`)
          .send({ text, delete_password });
        const thread = threadPostRes.body;
        console.log(thread);
        const thread_id = thread._id;

        // Then add a reply to it
        const replyPostRes = await chai
          .request(server)
          .post(`/api/replies/${board}`)
          .send({ thread_id, text, delete_password });

        const updatedThread = replyPostRes.body;
        console.log(updatedThread);

        assert.strictEqual(thread._id, updatedThread._id);
        assert.isBelow(
          new Date(thread.bumped_on),
          new Date(updatedThread.bumped_on)
        );
        assert.isNotEmpty(updatedThread.replies);
        assert.lengthOf(updatedThread.replies, 1);
        const reply = updatedThread.replies[0];
        const properties = [
          "_id",
          "text",
          "created_on",
          "delete_password",
          "reported"
        ];
        properties.forEach(property => assert.property(reply, property));
      });
    });

    suite("GET", function() {});

    suite("PUT", function() {});

    suite("DELETE", function() {});
  });
});
