"use strict";

(function () {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;
  var faceSize = 4096;
  var sceneIndex = 0;
  var scenes;
  var initialViewParameters = {
    pitch: 0,
    yaw: 0,
    fov: 1.5707963267948966,
  };

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
      var view = new Marzipano.RectilinearView(initialViewParameters, limiter);

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
    scene.view.setParameters(initialViewParameters);
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
  function getAddressJson(address) {
    var xhttp = new XMLHttpRequest();
    xhttp.responseType = "json";
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // on receival of new address json (specifies tile paths)
        // create new req to send prev address json (with distress indicator)
        // var req = new XMLHttpRequest();
        // req.open("POST", "addr1.json", true);
        // req.send();
        createNewScenes(this.response);
      }
    };
    xhttp.open("GET", address, true);
    xhttp.send();
  }
  // all scenes will go left to right if I can help it
  // so that the arrows will line up with the direction
  // of the changing scenes
  if (sceneIndex == 0) {
    newSceneLeftButton.style.display = "none";
  }

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
    // request new JSON
    // create new scenes
    // reset onclick for both buttons
    // send old json w property info
    getAddressJson("json/addr2.json"); // executes createNewScenes on callback
  };
  // Display the initial scene.
  getAddressJson("json/addr1.json");
  //switchScene(scenes[sceneIndex]);
})();
