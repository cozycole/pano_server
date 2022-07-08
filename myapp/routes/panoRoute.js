var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.sendFile(
    "/Users/colet/programming/projects/pano_server/myapp/public/index.html"
  );
});

module.exports = router;
