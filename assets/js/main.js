var SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3R9zMspRpyfTb_dbZJfYBCOlzCYjoE3bjKAqtUEYogHv-OX71cJNrINlYbu-LY0fSLg/exec";

function api(action, payload) {
  var body = payload || {};
  body.action = action;
  return fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {"Content-Type": "text/plain;charset=utf-8"}
  }).then(function(r) { return r.json(); });
}

function toast(msg, err) {
  var t = document.createElement("div");
  t.className = "toast" + (err ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function() { t.classList.add("show"); });
  setTimeout(function() { t.classList.remove("show"); setTimeout(function() { t.remove(); }, 400); }, 2500);
}

function imgSrc(id) {
  return "https://drive.google.com/uc?export=view&id=" + id;
}

function renderImages(containerId, fileIds) {
  var el = document.getElementById(containerId);
  if (!fileIds || fileIds.length === 0) {
    el.innerHTML = '<p class="empty">No images for today</p>';
    return;
  }
  el.innerHTML = "";
  fileIds.forEach(function(id) {
    var img = document.createElement("img");
    img.src = imgSrc(id);
    img.loading = "lazy";
    img.onclick = function() { window.open(img.src, "_blank"); };
    el.appendChild(img);
  });
}

function load() {
  api("getCount").then(function(d) {
    if (d && !d.error) {
      document.getElementById("devops-count").textContent = d.devopsCount + " pages/day";
      document.getElementById("fullstack-count").textContent = d.fullstackCount + " pages/day";
    }
  }).catch(function() {});

  api("getDevops").then(function(d) {
    if (d && d.files) renderImages("devops-images", d.files);
  }).catch(function() {});

  api("getFullstack").then(function(d) {
    if (d && d.files) renderImages("fullstack-images", d.files);
  }).catch(function() {});
}

document.querySelectorAll(".update-form").forEach(function(form) {
  form.addEventListener("submit", function(e) {
    e.preventDefault();
    var section = form.dataset.section;
    var count = form.querySelector("input[type=number]").value;
    var password = form.querySelector("input[type=password]").value;
    api("updateCount", {section: section, count: count, password: password})
      .then(function(d) {
        if (d.error) { toast(d.error, true); return; }
        toast("Updated!");
        form.querySelector("input[type=number]").value = "";
        form.querySelector("input[type=password]").value = "";
        load();
      })
      .catch(function() { toast("Network error", true); });
  });
});

load();
