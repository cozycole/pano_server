var express = require("express");
var router = express.Router();
require("dotenv").config();
const { Pool } = require("pg");
const connectionString = process.env.CONN_STR;

const pool = new Pool({
  connectionString,
});

// Get list of addresses for the route
// ordered by timestamp
var routeAddresses;
var routeIndex = 0;

/* GET users listing. */
router.get("/", (req, res, next) => {
  res.render("index.html");
});

router.get("/addr_start", async (req, res) => {
  try {
    const addrList = await getAddrList();
    routeAddresses = addrList;
    console.log("Route addresses: ", routeAddresses);
    sceneJson = await createSceneJson(routeAddresses[routeIndex++]);
    console.log("Scene JSON: ", sceneJson);
    res.send(sceneJson);
  } catch {
    console.log("DB ERROR with /addr_start endpoint");
  }
});

router.get("/addr_req", async (req, res) => {
  if (req.query.addr) {
    console.log(req.query.addr);
    if (req.query.addr == "next") {
      if (routeIndex != routeAddresses.length) {
        res.send(await createSceneJson(routeAddresses[routeIndex++]));
      } else {
        res.sendStatus(500);
      }
    } else if (req.query.addr == "prev") {
      if (routeIndex != 0) {
        res.send(await createSceneJson(routeAddresses[routeIndex--]));
      } else {
        res.sendStatus(500);
      }
    } else {
      res.send(500);
      console.log("Unexpected query parameter specified to addr_req");
    }
  } else {
    resSend(500);
    console.log("No query parameter specified to addr_req");
  }
});

router.put("/", (req, res) => {
  console.log(req.body);
  res.sendStatus(201);
});

async function getAddrList() {
  try {
    // Get the list of all addresses within the route
    // *NOTE* if the Addr list gets large, may be better
    // to have queues that load a certain amount of addr
    // before and after the current index (to save memory and speed it up)
    const res = await pool.query(
      `SELECT a.address
        FROM spatial_fa_1 as sp
        JOIN test_addresses as a
        ON sp.addr_id = a.addr_id
        JOIN files as f
        ON f.file_id = sp.file_id
        GROUP BY a.addr_id
        ORDER BY avg(f.timestamp);`
    );
    return res.rows;
  } catch (err) {
    console.log(err.stack);
  }
}

async function createSceneJson(address) {
  try {
    // Get photo path associated with pano tiles
    const res = await pool.query(
      `SELECT filename, sp.yaw
    FROM files as f
    JOIN spatial_fa_1 as sp
    ON f.file_id = sp.file_id
    JOIN test_addresses as a
    ON a.addr_id = sp.addr_id
    WHERE address = '${address.address}'`
    );
    console.log(res.rows);
    var i = 1;
    var file, yaw;
    var scenes = res.rows.map((element) => {
      file = element.filename;
      yaw = element.yaw;
      return {
        id: `0-pano${i}`,
        name: `${address.address} ${i++}/${res.rows.length}`,
        prefix: file.slice(0, 2) + "/" + file.slice(2, 3) + "/" + file.slice(3),
        initialViewParameters: {
          pitch: 0,
          yaw: yaw,
          fov: 1.5707963267948966,
        },
      };
    });
    console.log("SCENES: ", scenes);
    return {
      scenes: scenes,
      name: address.address,
      initSceneIndex: 0, // SHOULD BE CLOSEST PHOTO
    };
  } catch (err) {
    console.log(err.stack);
  }
}

module.exports = router;
