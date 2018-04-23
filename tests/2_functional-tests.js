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

suite("Functional Tests", function() {
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

    suite("GET", function() {});

    suite("DELETE", function() {});

    suite("PUT", function() {});
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {});

    suite("GET", function() {});

    suite("PUT", function() {});

    suite("DELETE", function() {});
  });
});
