const input = document.getElementsByTagName("input")[0];
const output = document.getElementById("output");
const outputRoute = document.getElementById("outputRoute");
const button = document.getElementsByTagName("button")[0];
const form = document.getElementsByTagName("form")[0];
let stopIDArray = [];
let filter = [];
let selectedRoute = {};
let overlay = null;

// Create the SVG icon
const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute(
  "class",
  "w-6 h-6 text-gray-800 relative top-[9px] left-[5px]"
);
svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
svg.setAttribute("aria-hidden", "true");
svg.setAttribute("viewBox", "0 0 24 24");
svg.setAttribute("fill", "none");
svg.setAttribute("width", "24");
svg.setAttribute("height", "24");

const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
path.setAttribute("stroke", "currentColor");
path.setAttribute("stroke-linecap", "round");
path.setAttribute("stroke-width", "2");
path.setAttribute("d", "m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z");

svg.appendChild(path);

// Append the SVG icon to the input field
const magGlass = document.createElement("div");

magGlass.className =
  "border-l-4 border-b-4 border-t-4 rounded-l-lg w-7 h-[50px] border-gray-950";

magGlass.appendChild(svg);

form.addEventListener("submit", function (event) {
  event.preventDefault();

  fetch(form.action, {
    method: "GET",
    body: new FormData(form),
  });
});

function handleInputFocus() {
  if (!form.contains(magGlass)) {
    form.insertBefore(magGlass, input);

    input.classList.remove("border-4", "rounded-lg", "rounded-l-lg");
    input.classList.add(
      "border-r-4",
      "border-b-4",
      "border-t-4",
      "rounded-r-lg"
    );
    // Apply focus styling to the input and magGlass, except the left border of the input
    input.classList.add("focus:outline-none");
    magGlass.classList.add("focus:outline-none");
  }
  document.addEventListener("click", handleDocumentClick);
}

function handleDocumentClick(event) {
  // Check if the click target is the input or a descendant of the input
  if (!input.contains(event.target) && !magGlass.contains(event.target)) {
    // Click occurred outside the input box
    // Remove the magGlass element
    if (form.contains(magGlass)) {
      form.removeChild(magGlass);
      input.classList.add("border-4", "rounded-l-lg");
    }
  }
}

input.addEventListener("focus", handleInputFocus);
// Add a click event listener to the document

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
      route.id = "routeButton";
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

// async function for event listener for clicking on an inbound/outbound or a special route
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
  // console.log(routeIndex);
  // console.log(selectedRoute);

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
    stop.id = "stopButton";
    stop.className =
      "flex flex-col items-center justify-center border-red-500 border-4 border-b-0 w-[500px]";
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
  loading(); // Display loading overlay

  try {
    const res = await fetch(
      `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${route}/${direction}/${service_type}`
    );
    const json = await res.json();
    const data = json.data;

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Delay for 2000 milliseconds

    return data;
  } catch (err) {
    console.log(err);
  } finally {
    removeLoading(); // Remove loading overlay
  }
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
  if (clickedButton.querySelector("div")) {
    const divElements = clickedButton.querySelectorAll("div");
    divElements.forEach((div) => {
      clickedButton.removeChild(div);
    });
  } else if (!clickedButton.querySelector("div")) {
    const stopIndex = Array.from(
      outputRoute.getElementsByTagName("button")
    ).indexOf(clickedButton);
    // console.log(stopIndex);
    const stopID = stopIDArray[stopIndex];
    const route = selectedRoute.route;
    const service_type = selectedRoute.service_type;
    const processETAObj = await fetchETA(stopID, route, service_type);
    // console.log(stopID, route, service_type);

    const processETAFilter = processETAObj.filter(
      (el) => el.dir === selectedRoute.bound
    );
    // console.log(selectedRoute.bound);
    // console.log(processETAObj);

    for (let i = 0; i < processETAFilter.length; i++) {
      if (processETAFilter[i].eta !== null) {
        const ETADiv = document.createElement("div");
        ETADiv.id = "ETAButton";
        setInterval(() => {
          const remainingMinutes = calculateMinutesRemaining(
            processETAFilter[i].eta
          );
          // console.log(remainingMinutes);
          const ETAOrgText = processETAFilter[i].eta;

          ETADiv.innerText = `${ETAOrgText.split("")
            .slice(11, 13)
            .join("")}時${ETAOrgText.split("")
            .slice(14, 16)
            .join("")}分 (${remainingMinutes}分鐘)`;
        }, 1000);
        setTimeout(() => {
          clickedButton.classList.toggle("expanded");
        }, 2000);
        clickedButton.appendChild(ETADiv);
      } else {
        const ETAMissing = document.createElement("div");
        ETAMissing.innerText =
          `${processETAFilter[i].rmk_tc}` || `最後的班次已開出！`;
        clickedButton.classList.toggle("expanded");
        clickedButton.appendChild(ETAMissing);
      }
    }
  }
}

function calculateMinutesRemaining(eta) {
  const now = new Date();
  const etaTime = new Date(eta);
  const diff = etaTime - now;
  const minutesRemaining = Math.floor(diff / (1000 * 60));
  return minutesRemaining;
}

function loading() {
  if (overlay) {
    return; // Return early if the loading overlay is already displayed
  }

  overlay = document.createElement("div");
  overlay.className = "bg-blend-darken";
  overlay.id = "overlay";
  document.body.appendChild(overlay);

  const loadingImg = document.createElement("img");
  loadingImg.id = "loadingImg";
  loadingImg.className = "object-cover w-48 mx-auto m-20";
  loadingImg.src = "./loading.gif";
  loadingImg.alt = "";

  overlay.appendChild(loadingImg);
}

function removeLoading() {
  if (overlay) {
    overlay.parentNode.removeChild(overlay);
    overlay = null; // Reset the overlay variable
  }
}
