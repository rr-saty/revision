var PASSWORD = "RadheRadhe";
var DEV_FOLDER_ID = "1DRRSy42KqYIinMnjEykSTeb4nuuBHEHn";
var FS_FOLDER_ID = "1OcmxuQ_dBiaolLx_99umOEO5YO46Lh_c";
var SCRIPT_PROP = PropertiesService.getScriptProperties();

function doGet(e) {
  var p = e.parameter || {};
  var action = p.action;
  var cb = p.callback || "";

  var data = {};
  if (action === "getCount") data = JSON.parse(SCRIPT_PROP.getProperty("count") || '{"devopsCount":1,"fullstackCount":1}');
  else if (action === "getDevops") data = JSON.parse(SCRIPT_PROP.getProperty("devops_today") || '{"files":[]}');
  else if (action === "getFullstack") data = JSON.parse(SCRIPT_PROP.getProperty("fullstack_today") || '{"files":[]}');
  else if (action === "updateCount") {
    if (p.password !== PASSWORD) data = {"error":"Incorrect password"};
    else {
      var c = JSON.parse(SCRIPT_PROP.getProperty("count") || '{"devopsCount":1,"fullstackCount":1}');
      if (p.section === "devops") c.devopsCount = Number(p.count);
      if (p.section === "fullstack") c.fullstackCount = Number(p.count);
      c.updatedAt = new Date().toISOString().slice(0,10);
      SCRIPT_PROP.setProperty("count", JSON.stringify(c));
      data = {"ok":true};
    }
  }
  else data = {"error":"Unknown action"};

  return json_(data, cb);
}

function doPost(e) {
  return doGet(e);
}

function json_(data, callback) {
  var json = JSON.stringify(data);
  var output = ContentService.createTextOutput();
  if (callback) output.setContent(callback + "(" + json + ");");
  else output.setContent(json);
  return output.setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function dailyDevops() {
  var count = 1;
  var stored = SCRIPT_PROP.getProperty("count");
  if (stored) { try { count = JSON.parse(stored).devopsCount || 1; } catch(ex) {} }
  var files = getFolderFiles_(DEV_FOLDER_ID);
  var picked = pickRandom_(files, count);
  SCRIPT_PROP.setProperty("devops_today", JSON.stringify({date: today_(), files: picked}));
}

function dailyFullstack() {
  var count = 1;
  var stored = SCRIPT_PROP.getProperty("count");
  if (stored) { try { count = JSON.parse(stored).fullstackCount || 1; } catch(ex) {} }
  var files = getFolderFiles_(FS_FOLDER_ID);
  var picked = pickRandom_(files, count);
  SCRIPT_PROP.setProperty("fullstack_today", JSON.stringify({date: today_(), files: picked}));
}

function getFolderFiles_(folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var files = folder.getFiles();
  var result = [];
  while (files.hasNext()) {
    var f = files.next();
    if (f.getMimeType().indexOf("image/") === 0 || f.getName().match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      result.push({id: f.getId(), name: f.getName()});
    }
  }
  return result;
}

function pickRandom_(arr, n) {
  var shuffled = arr.slice();
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
  }
  return shuffled.slice(0, n).map(function(f) { return f.id; });
}

function today_() {
  return new Date().toISOString().slice(0, 10);
}

function installTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger("dailyDevops")
    .timeBased()
    .everyDays(1)
    .atHour(19)
    .nearMinute(30)
    .create();

  ScriptApp.newTrigger("dailyFullstack")
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .nearMinute(20)
    .create();
}
