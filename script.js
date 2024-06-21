const input = document.getElementsByTagName("input")[0];
const processedInput = input.value
  .split(/[\s-]+/)
  .join()
  .toUpperCase();
input.value = processedInput;
const output = document.getElementById("output");

function processInput(data, input) {
  const filter = data.filter((el) => el.route === input.value);
  if (filter.length > 0) {
    for (i = 0; i < filter.length; i++) {
      const route = document.createElement("div");
      route.className = "rounded-lg w-3";
      route.innerText = `${data[i].origin_tc} → ${data[i].dest_tc}`;
      output.appendChild(route);
    }
  } else {
    const noResult = document.createElement("div");
  }
}

async function fetchKMB() {
  const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route/`);
  const json = await res.json();
  const data = json.data;
  processInput(data, input);
}
