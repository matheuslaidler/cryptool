// Import CryptoJS relative to this worker file (worker is in js/)
importScripts('crypto.min.js');

// Worker: receives {cmd:'start', hash, hashType, file} or {cmd:'start', hash, hashType, candidates}
var decoder = new TextDecoder();
var running = true;

function computeHashForCandidate(candidate, hashType) {
  if (typeof CryptoJS === 'undefined') {
    // CryptoJS not loaded; signal error to main thread
    throw new Error('CryptoJS não carregado no worker');
  }
  if (hashType === 'md5') return CryptoJS.MD5(candidate).toString();
  if (hashType === 'sha1') return CryptoJS.SHA1(candidate).toString();
  if (hashType === 'sha256') return CryptoJS.SHA256(candidate).toString();
  if (hashType === 'sha3-256') return CryptoJS.SHA3(candidate, { outputLength: 256 }).toString();
  return '';
}

self.onmessage = async function(e) {
  var data = e.data;
  if (!data || !data.cmd) return;
  if (data.cmd === 'abort') {
    running = false;
    self.postMessage({type:'aborted'});
    return;
  }

  if (data.cmd === 'start') {
    running = true;
    var targetHash = String(data.hash || '').toLowerCase();
    var hashType = data.hashType || 'md5';

    // If candidates array is provided, iterate through them and then stay alive
    if (Array.isArray(data.candidates) && data.candidates.length) {
      var total = data.candidates.length;
      for (var i = 0; i < total && running; i++) {
        var c = String(data.candidates[i]);
        var h = computeHashForCandidate(c, hashType).toLowerCase();
        if (h === targetHash) { self.postMessage({type:'found', word:c}); return; }
        if (i % 50 === 0) self.postMessage({type:'progress', processed:i, total:total});
      }
      // signal batch completion
      self.postMessage({type:'batchDone', processed: total});
      return;
    }

    // If file is provided (File/Blob) and worker environment supports streaming
    var file = data.file;
    if (file && file.stream) {
      try {
        var reader = file.stream().getReader();
        var utf8decoder = new TextDecoder();
        var leftover = '';
        var processedBytes = 0;
        var fileSize = file.size || 0;
        var totalLines = 0;
        while (running) {
          var r = await reader.read();
          if (r.done) break;
          var chunk = r.value;
          processedBytes += chunk.byteLength || 0;
          var text = utf8decoder.decode(chunk, {stream:true});
          var combined = leftover + text;
          var parts = combined.split(/\r?\n/);
          leftover = parts.pop();
          for (var j = 0; j < parts.length && running; j++) {
            var cand = parts[j].trim();
            if (!cand) continue;
            totalLines++;
            var h = computeHashForCandidate(cand, hashType).toLowerCase();
            if (h === targetHash) { self.postMessage({type:'found', word:cand}); return; }
            if (totalLines % 100 === 0) self.postMessage({type:'progress', processedBytes:processedBytes, fileSize:fileSize});
          }
        }
        // process leftover
        if (running && leftover) {
          var cand = leftover.trim();
          if (cand) {
            var h = computeHashForCandidate(cand, hashType).toLowerCase();
            if (h === targetHash) { self.postMessage({type:'found', word:cand}); return; }
          }
        }
        if (running) self.postMessage({type:'done'});
        else self.postMessage({type:'aborted'});
      } catch (err) {
        self.postMessage({type:'error', message: String(err)});
      }
    } else {
      // worker does not support file.stream()
      self.postMessage({type:'error', message: 'Streaming não suportado neste navegador.'});
    }
  }

  // Support incremental batch processing: startBatch with candidates array
  if (data.cmd === 'startBatch') {
    running = true;
    var targetHashB = String(data.hash || '').toLowerCase();
    var hashTypeB = data.hashType || 'md5';
    var batch = Array.isArray(data.candidates) ? data.candidates : [];
    var totalB = batch.length;
    for (var k = 0; k < totalB && running; k++) {
      var cc = String(batch[k]);
      var hh = computeHashForCandidate(cc, hashTypeB).toLowerCase();
      if (hh === targetHashB) { self.postMessage({type:'found', word:cc}); return; }
      if (k % 50 === 0) self.postMessage({type:'progress', processed:k, total:totalB});
    }
    // batch processed
    self.postMessage({type:'batchDone', processed: totalB});
  }
};
