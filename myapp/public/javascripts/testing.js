"use strict";

var main = () => {
  var start = document.querySelector("#start");
  var next = document.querySelector("#next");
  next.onclick = () => {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", `/pano/addr_req?addr=next`);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        console.log(this.response);
      }
    };
    console.log("request sent...");
    xhttp.send();
  };

  start.onclick = () => {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", `/pano/addr_start`);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4) {
        console.log(this.response);
      }
    };
    console.log("request sent...");
    xhttp.send();
  };
};
// `/pano/addr_req?addr=${"1609 E 24th Ave".split(" ").join("+")}`
main();
