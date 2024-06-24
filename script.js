const input = document.getElementsByTagName("input")[0];
const output = document.getElementById("output");
const outputRoute = document.getElementById("outputRoute");
const button = document.getElementsByTagName("button")[0];
const form = document.getElementsByTagName("form")[0];
let stopIDArray = [];
let filter = [];
let selectedRoute = {};

form.addEventListener("submit", function (event) {
  event.preventDefault();

  fetch(form.action, {
    method: "GET",
    body: new FormData(form),
  });
});

// input.addEventListener("click", function () {
//   //   <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
//   //   <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
//   // </svg>
//   input.classList.add = "w-[500px]";
//   input.classList.remove = "w-96";

//   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

//   svg.setAttribute("class", "w-6 h-6 text-gray-800");
//   svg.setAttribute("aria-hidden", "true");
//   svg.setAttribute("viewBox", "0 0 24 24");
//   svg.setAttribute("fill", "none");
//   svg.setAttribute("width", "24");
//   svg.setAttribute("height", "24");

//   const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
//   path.setAttribute("stroke", "currentColor");
//   path.setAttribute("stroke-linecap", "round");
//   path.setAttribute("stroke-width", "2");
//   path.setAttribute("d", "m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z");
//   svg.appendChild(path);
//   input.appendChild(svg);
// });

// Function for processing input
function processInput(data, input) {
  while (output.lastChild) {
    output.removeChild(output.lastChild);
  }
  while (outputRoute.lastChild) {
    outputRoute.removeChild(outputRoute.lastChild);
  }

  filter = data.filter((el) => el.route === input.value);

  if (filter.length > 0) {
    for (let i = 0; i < filter.length; i++) {
      const route = document.createElement("button");
      route.className = "rounded-lg mr-11 px-2 border-zinc-800 border-4";
      route.innerText = `${filter[i].orig_tc} → ${filter[i].dest_tc}`;
      output.appendChild(route);
      route.addEventListener("click", processRoute);
    }
  } else {
    const noResult = document.createElement("div");
    noResult.innerText = `這條路線不存在!`;
    output.appendChild(noResult);
  }
}

// Async function for fetching data with processed input
async function fetchKMB() {
  const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route/`);
  const json = await res.json();
  const data = json.data;

  const processedInput = input.value
    .toUpperCase()
    .split(/[\s-]+/)
    .join("");
  input.value = processedInput;
  // console.log(data);
  processInput(data, input);
}

// Event listener for submission of input
button.addEventListener("click", fetchKMB);

async function processRoute(event) {
  while (outputRoute.lastChild) {
    outputRoute.removeChild(outputRoute.lastChild);
  }
  const clickedButton = event.target;
  const routeIndex = Array.from(output.getElementsByTagName("button")).indexOf(
    clickedButton
  );

  let direction = "";

  selectedRoute = filter[routeIndex];
  console.log(routeIndex);
  console.log(selectedRoute);

  switch (selectedRoute.bound) {
    case "I":
      direction = "inbound";
      break;
    case "O":
      direction = "outbound";
      break;
  }

  const stopList = await fetchStops(
    selectedRoute.route,
    direction,
    selectedRoute.service_type
  );

  stopIDArray = [];
  for (let i = 0; i < stopList.length; i++) {
    const stop = document.createElement("button");
    stop.className = "flex-col items-center justify-center";
    const stopObj = await fetchStopID(stopList[i].stop);
    // console.log(stopList[i].stop);
    const stopName = stopObj.name_tc;
    stop.innerText = stopName;
    outputRoute.appendChild(stop);
    stopIDArray.push(stopList[i].stop);
    stop.addEventListener("click", processETA);
  }
}

async function fetchStops(route, direction, service_type) {
  const res = await fetch(
    `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/${direction}/${service_type}`
  );
  const json = await res.json();
  const data = json.data;
  return data;
}

async function fetchStopID(stopID) {
  const res = await fetch(
    `https://data.etabus.gov.hk/v1/transport/kmb/stop/${stopID}`
  );
  const json = await res.json();
  const data = json.data;
  return data;
}

async function fetchETA(stopID, route, service_type) {
  const res = await fetch(
    `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopID}/${route}/${service_type}`
  );
  const json = await res.json();
  const data = json.data;
  return data;
}

async function processETA(event) {
  const clickedButton = event.target;
  const divElements = clickedButton.querySelectorAll("div");
  divElements.forEach((div) => {
    clickedButton.removeChild(div);
  });

  if (!clickedButton.querySelector("div")) {
    const stopIndex = Array.from(
      outputRoute.getElementsByTagName("button")
    ).indexOf(clickedButton);
    // console.log(stopIndex);
    const stopID = stopIDArray[stopIndex];
    const route = selectedRoute.route;
    const service_type = selectedRoute.service_type;
    const processETAObj = await fetchETA(stopID, route, service_type);
    console.log(stopID, route, service_type);

    const processETAFilter = processETAObj.filter(
      (el) => el.dir === selectedRoute.bound
    );
    console.log(selectedRoute.bound);
    console.log(processETAObj);

    for (let i = 0; i < processETAFilter.length; i++) {
      if (processETAFilter[i].eta !== null || processETAFilter.length > 0) {
        const ETADiv = document.createElement("div");
        setInterval(() => {
          const ETAOrgText = processETAFilter[i].eta;

          ETADiv.innerText = `${ETAOrgText.split("")
            .slice(11, 13)
            .join("")}時${ETAOrgText.split("").slice(14, 16).join("")}分`;
        }, 1000);
        clickedButton.appendChild(ETADiv);
      } else if (processETAFilter.length === 0) {
        const ETAMissing = document.createElement("div");
        ETAMissing.innerText =
          `最後的班次已開出！` || `發生錯誤，不便之處，敬請原諒！`;
        clickedButton.appendChild(ETAMissing);
      } else {
        const ETAMissing = document.createElement("div");
        ETAMissing.innerText = `${processETAFilter[i].rmk_tc}`;
        clickedButton.appendChild(ETAMissing);
      }
    }
  }
}
