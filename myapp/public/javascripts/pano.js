"use strict";

(function () {
  var Marzipano = window.Marzipano;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;
  var faceSize = 4096;
  var sceneIndex = 0;
  var scenes;
  var routeJson;

  // Grab elements from DOM.
  var panoElement = document.querySelector("#pano");
  var sceneNameElement = document.querySelector("#titleBar .sceneName");
  var sceneListElement = document.querySelector("#sceneList");
  var sceneElements = document.querySelectorAll("#sceneList .scene");
  var sceneListToggleElement = document.querySelector("#sceneListToggle");
  var fullscreenToggleElement = document.querySelector("#fullscreenToggle");
  var newSceneLeftButton = document.querySelector("#newPanoLeft");
  var newSceneRightButton = document.querySelector("#newPanoRight");
  var nextHouseButton = document.querySelector("#nextHouse");
  var prevHouseButton = document.querySelector("#prevHouse");

  var distressedBox = document.querySelector("#distressed");
  var superlistBox = document.querySelector("#superlist");
  var underterminedBox = document.querySelector("#undetermined");

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode,
    },
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // Function to create scenes.
  function createNewScenes(addrJson) {
    // mutating global variable here (might be bad idea)
    routeJson = {
      nextAddr: addrJson.nextAddr,
      prevAddr: addrJson.prevAddr,
      routeIndex: addrJson.routeIndex,
    };
    scenes = addrJson.scenes.map(function (data) {
      // data == scene data
      var urlPrefix = "tiles";
      var source = Marzipano.ImageUrlSource.fromString(
        urlPrefix + "/" + data.prefix + "/{z}/{f}/{y}/{x}.jpg",
        {
          cubeMapPreviewUrl: urlPrefix + "/" + data.prefix + "/preview.jpg",
        }
      );
      var geometry = new Marzipano.CubeGeometry(window.APP_DATA.levels);

      var limiter = Marzipano.RectilinearView.limit.traditional(
        faceSize,
        (100 * Math.PI) / 180,
        (120 * Math.PI) / 180
      );
      var view = new Marzipano.RectilinearView(
        data.initialViewParameters,
        limiter
      );

      var scene = viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true,
      });
      return {
        data: data,
        scene: scene,
        view: view,
      };
    });
    sceneIndex = addrJson.initSceneIndex;
    switchScene(scenes[sceneIndex]);
  }

  // Set up fullscreen mode, if supported.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add("fullscreen-enabled");
    fullscreenToggleElement.addEventListener("click", function () {
      screenfull.toggle();
    });
    screenfull.on("change", function () {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add("enabled");
      } else {
        fullscreenToggleElement.classList.remove("enabled");
      }
    });
  } else {
    document.body.classList.add("fullscreen-disabled");
  }

  // Set handler for scene list toggle.
  sceneListToggleElement.addEventListener("click", toggleSceneList);

  function sanitize(s) {
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
  }

  function switchScene(scene) {
    console.log(scenes);
    scene.view.setParameters(scene.data.initialViewParameters);
    scene.scene.switchTo({ transitionDuration: 100 }); // 0.1 sec
    updateSceneName(scene);
    updateSceneList(scene);
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute("data-id") === scene.data.id) {
        el.classList.add("current");
      } else {
        el.classList.remove("current");
      }
    }
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle("enabled");
    sceneListToggleElement.classList.toggle("enabled");
  }

  // #### MY CODE ####

  function jsonRequest(address, action, body = null, callback) {
    // Creates GET or POST request
    var xhttp = new XMLHttpRequest();
    xhttp.open(action, address);
    xhttp.responseType = "json";
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200 && action == "GET") {
          callback(this.response);
        } else if (this.status == 201 && action == "PUT") {
          console.log("JSON PLACED IN DB");
        } else {
          setTimeout(() => {
            console.log(`${action} REQUEST DIDN'T WORK`);
            jsonRequest(address, action, body); // try again in 5 seconds
          }, 5000);
        }
      }
    };
    console.log(body);
    xhttp.send(body);
  }
  // all scenes will go left to right if I can help it
  // so that the arrows will line up with the direction
  // of the changing scenes

  newSceneLeftButton.onclick = () => {
    switchScene(scenes[--sceneIndex]);
    console.log(`Scene ${sceneIndex + 1}`);
    if (sceneIndex == 0) {
      newSceneLeftButton.style.display = "none";
    }
    newSceneRightButton.style.display = "inline-block";
  };

  newSceneRightButton.onclick = () => {
    switchScene(scenes[++sceneIndex]);
    console.log(`Scene ${sceneIndex + 1}`);
    if (sceneIndex == scenes.length - 1) {
      newSceneRightButton.style.display = "none";
    }
    newSceneLeftButton.style.display = "inline-block";
  };

  // Hide prev house button if it is the first in the route
  if (data.routeIndex == 0) {
    prevHouseButton.style.display = "none";
  }

  nextHouseButton.onclick = () => {
    // reset onclick for both buttons
    // send json w property info
    jsonRequest(
      "/pano",
      "PUT",
      JSON.stringify({
        distressed: distressedBox.checked,
        superlist: superlistBox.checked,
        undertermined: underterminedBox.checked,
      })
    );
    // uncheck property condition boxes
    distressedBox.checked = false;
    superlistBox.checked = false;
    underterminedBox.checked = false;
    console.log("GET", routeJson);
    jsonRequest(routeJson.nextAddr, "GET", null, createNewScenes); // executes createNewScenes on callback
  };

  underterminedBox.onclick = () => {
    distressedBox.checked = false;
    superlistBox.checked = false;
  };

  superlistBox.onclick = () => {
    distressedBox.checked = false;
    underterminedBox.checked = false;
  };

  distressedBox.onclick = () => {
    superlistBox.checked = false;
    underterminedBox.checked = false;
  };
  // Display the initial scene.
  jsonRequest("json/addr1.json", "GET", null, createNewScenes);
  //switchScene(scenes[sceneIndex]);
})();
