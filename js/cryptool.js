// Cryptool - Matheus Laidler
(function(window){
'use strict';
// user-provided wordlist (from upload)
var userWordlist = null;
var crackWorker = null;
var currentWorkerRunning = false;
var lastProgressTimestamp = 0;
var lastProcessedCount = 0;
// flag used by chunkFileInBatches to cancel reading when abort requested
var chunkedCancelFlag = false;
// Função para converter o valor
function convertValue() {
  var conversionType = document.getElementById("conversionType").value;
  var actionType = (document.getElementById("actionType") || {}).value || 'encode';
  var inputValue = document.getElementById("text").value.trim();
  var resultElement = document.getElementById("result");

  // Verifica se o valor de entrada está vazio
  if (!inputValue) {
    resultElement.innerText = "Por favor, insira um valor.";
    return;
  }

  // Verifica se uma opção de conversão foi selecionada
  if (conversionType === "select") {
    resultElement.innerText = "Por favor, escolha uma opção.";
    return;
  }

  var convertedValue = "";

  // Realiza a conversão com base no tipo selecionado
  switch (conversionType) {
    case "numericConversion":
      convertedValue = convertNumeric(inputValue);
      break;
    case "textualConversion":
      convertedValue = convertTextual(inputValue);
      break;
    case "cryptoCipher":
      convertedValue = convertCryptoCipher(inputValue, actionType);
      break;
    case "hash":
        if (actionType === 'decode') {
          var hashType = document.getElementById('hashType').value;
          // attempt quick crack with in-memory small list
          var cracked = crackHash(inputValue, hashType);
          resultElement.textContent = cracked ? cracked : 'Não encontrado na wordlist.';
          return;
        } else {
          convertToHash();
          return;
        }
    default:
      resultElement.innerText = "Opção de conversão inválida.";
      return;
  }

  // Atualiza o resultado na página
  resultElement.textContent = convertedValue;
}

// Função para mostrar as opções apropriadas ao selecionar o tipo de conversão
function showConversionOptions() {
  var conversionType = document.getElementById("conversionType").value;
  var conversionOptions = document.getElementById("conversionOptions");
  var textualConversionOptions = document.getElementById(
    "textualConversionOptions"
  );
  var cryptoCipherOptions = document.getElementById("cryptoCipherOptions");
  var hashOptions = document.getElementById("hashOptions");
  var actionRow = document.getElementById('actionRow');

  // Show the action row (Encode/Decode + wordlist UI) only for cipher/hash types
  if (actionRow) {
    if (conversionType === 'cryptoCipher' || conversionType === 'hash') {
      actionRow.style.display = 'table-row';
    } else {
      actionRow.style.display = 'none';
      // reset any progress UI
      var progress = document.getElementById('crackProgress'); if (progress) progress.style.display='none';
      var abortBtn = document.getElementById('abortCrackBtn'); if (abortBtn) abortBtn.style.display='none';
      var openBtn = document.getElementById('openWordlistModalBtn'); if (openBtn) openBtn.style.display='none';
      var log = document.getElementById('crackLog'); if (log) log.textContent = '';
    }
  }

  // Oculta todas as opções
  conversionOptions.style.display = "none";
  textualConversionOptions.style.display = "none";
  cryptoCipherOptions.style.display = "none";
  hashOptions.style.display = "none";

  // Mostra as opções apropriadas com base no tipo de conversão selecionado
  if (conversionType === "numericConversion") {
    conversionOptions.style.display = "block";
    populateOptions(
      "conversionSubType",
      ["decToBin", "binToDec", "decToHex", "hexToDec"],
      [
        "Decimal para Binário",
        "Binário para Decimal",
        "Decimal para Hexadecimal",
        "Hexadecimal para Decimal",
      ]
    );
  } else if (conversionType === "textualConversion") {
    textualConversionOptions.style.display = "block";
    populateOptions(
      "textualConversionSubType",
      ["decToStr", "strToDec", "upperCase", "lowerCase"],
      ["Decimal para String", "String para Decimal", "Maiúsculas", "Minúsculas"]
    );
  } else if (conversionType === "cryptoCipher") {
    cryptoCipherOptions.style.display = "block";
    populateOptions(
      "cryptoCipherSubType",
      ["morse", "caesar", "base64", "rot13"],
      ["Morse", "Cifra de César", "Base64", "ROT13"]
    );
  } else if (conversionType === "hash") {
    hashOptions.style.display = "block";
  }
}

// Função para popular as opções de seleção
function populateOptions(elementId, values, labels) {
  var element = document.getElementById(elementId);
  element.innerHTML = "";

  // Cria as opções com base nos valores e rótulos fornecidos
  for (var i = 0; i < values.length; i++) {
    var option = document.createElement("option");
    option.value = values[i];
    option.innerText = labels[i];
    element.appendChild(option);
  }
}

// Função para converter os valores numéricos
function convertNumeric(inputValue) {
  var conversionSubType = document.getElementById("conversionSubType").value;

  // Realiza a conversão com base no subtipo selecionado
  switch (conversionSubType) {
    case "decToBin":
      return decimalToBinary(inputValue);
    case "binToDec":
      return binaryToDecimal(inputValue);
    case "decToHex":
      return decimalToHexadecimal(inputValue);
    case "hexToDec":
      return hexadecimalToDecimal(inputValue);
    default:
      return "Opção de conversão numérica inválida.";
  }
}

// Função para converter os valores textuais
function convertTextual(inputValue) {
  var conversionSubType = document.getElementById(
    "textualConversionSubType"
  ).value;

  // Realiza a conversão com base no subtipo selecionado
  switch (conversionSubType) {
    case "decToStr":
      return decimalToString(inputValue);
    case "strToDec":
      return stringToDecimal(inputValue);
    case "upperCase":
      return convertToUpperCase(inputValue);
    case "lowerCase":
      return convertToLowerCase(inputValue);
    default:
      return "Opção de conversão textual inválida.";
  }
}

// Função para converter as cifras e criptografias
function convertCryptoCipher(inputValue, action) {
  var conversionSubType = document.getElementById("cryptoCipherSubType").value;

  // Realiza a conversão com base no subtipo selecionado e ação
  switch (conversionSubType) {
    case "morse":
      return action === 'decode' ? decodeMorse(inputValue) : convertToMorse(inputValue);
    case "caesar":
      return action === 'decode' ? cipherCaesar(inputValue, -3) : cipherCaesar(inputValue, 3);
    case "base64":
      return action === 'decode' ? decodeBase64(inputValue) : convertToBase64(inputValue);
    case "rot13":
      return cipherROT13(inputValue); // ROT13 is symmetric
    default:
      return "Opção de cifra inválida.";
  }
}

// Função para converter em hash
function convertToHash() {
  var textInput = document.getElementById("text").value;
  var resultElement = document.getElementById("result");
  var hashType = document.getElementById("hashType").value;

  // Verifica se o texto de entrada está vazio
  if (textInput === "") {
    resultElement.innerText = "Por favor, insira um texto.";
    return;
  }

  var hashResult = "";
  // Converte o texto para o tipo de hash selecionado
  switch (hashType) {
    case "md5":
      hashResult = calculateMD5(textInput);
      break;
    case "sha1":
      hashResult = calculateSHA1(textInput);
      break;
    case "sha256":
      hashResult = calculateSHA256(textInput);
      break;
    case "sha3-256":
      hashResult = calculateSHA3_256(textInput);
      break;
    default:
      resultElement.innerText = "Opção de hash inválida.";
      return;
  }

  // Atualiza o resultado na página
  resultElement.innerText = hashResult;
}

// Todas as funções para os cálculos e resultados de cada codificação

// functions to encryption & conversions - matheus laidler
// Função para converter decimal para binário
function decimalToBinary(decimal) {
  var binary = Number(decimal).toString(2);
  return binary;
}

// Função para converter binário para decimal
function binaryToDecimal(binary) {
  var decimal = parseInt(binary, 2);
  return decimal;
}

// Função para converter decimal para hexadecimal
function decimalToHexadecimal(decimal) {
  var hexadecimal = Number(decimal).toString(16).toUpperCase();
  return hexadecimal;
}
// Função para converter decimal para hexadecimal
//function decimalToHex(decimalValue) {
//  var decimalNumber = parseInt(decimalValue);
//
// Verifica se o valor decimal é um número válido
//  if (isNaN(decimalNumber)) {
//    return "Valor inválido. Insira um número decimal válido.";
//  }
//
//  var hexadecimal = decimalNumber.toString(16).toUpperCase();
//  return hexadecimal;
//}

// Função para converter hexadecimal para decimal
function hexadecimalToDecimal(hexadecimal) {
  var decimal = parseInt(hexadecimal, 16);
  return decimal;
}

// Função para converter decimal para string
function decimalToString(decimal) {
  var string = String.fromCharCode(decimal);
  return string;
}

// Função para converter string para decimal
function stringToDecimal(string) {
  var decimal = 0;
  for (var i = 0; i < string.length; i++) {
    decimal += string.charCodeAt(i);
  }
  return decimal;
}

// Função para converter valor para maiúsculas
function convertToUpperCase(value) {
  var upperCaseValue = value.toUpperCase();
  return upperCaseValue;
}

// Função para converter valor para minúsculas
function convertToLowerCase(value) {
  var lowerCaseValue = value.toLowerCase();
  return lowerCaseValue;
}

// Função para converter texto em código Morse
function convertToMorse(text) {
  var morseCode = {
    A: ".-",
    B: "-...",
    C: "-.-.",
    D: "-..",
    E: ".",
    F: "..-.",
    G: "--.",
    H: "....",
    I: "..",
    J: ".---",
    K: "-.-",
    L: ".-..",
    M: "--",
    N: "-.",
    O: "---",
    P: ".--.",
    Q: "--.-",
    R: ".-.",
    S: "...",
    T: "-",
    U: "..-",
    V: "...-",
    W: ".--",
    X: "-..-",
    Y: "-.--",
    Z: "--..",
    " ": "/",
  };

  var morseResult = "";
  text = text.toUpperCase();

  for (var i = 0; i < text.length; i++) {
    var char = text[i];
    if (morseCode.hasOwnProperty(char)) {
      morseResult += morseCode[char] + " ";
    }
  }

  return morseResult;
}

// Função para converter texto em Base64
function convertToBase64(text) {
  return utf8ToBase64(text);
}

function decodeBase64(text) {
  return base64ToUtf8(text);
}

// UTF-8 safe base64 helpers
function utf8ToBase64(str) {
  try {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (e) {
    return 'Erro ao converter para Base64';
  }
}

function base64ToUtf8(b64) {
  try {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch (e) {
    return 'Entrada Base64 inválida.';
  }
}

// Função para cifra de César
function cipherCaesar(text, shift) {
  shift = typeof shift === 'number' ? shift : 3;
  var res = "";
  for (var i = 0; i < text.length; i++) {
    var ch = text.charCodeAt(i);
    if (ch >= 65 && ch <= 90) {
      var base = 65;
      var s = ((ch - base + shift) % 26 + 26) % 26;
      res += String.fromCharCode(base + s);
    } else if (ch >= 97 && ch <= 122) {
      var base2 = 97;
      var s2 = ((ch - base2 + shift) % 26 + 26) % 26;
      res += String.fromCharCode(base2 + s2);
    } else {
      res += text[i];
    }
  }
  return res;
}

// Decodifica Morse (espera pontos e traços separados por espaços; '/' indica espaço entre palavras)
function decodeMorse(code) {
  var morseCode = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };
  // invert map
  var rev = {};
  for (var k in morseCode) if (morseCode.hasOwnProperty(k)) rev[morseCode[k]] = k;

  var words = code.trim().split(' / ');
  var result = [];
  for (var w = 0; w < words.length; w++) {
    var letters = words[w].split(/\s+/);
    var out = '';
    for (var i = 0; i < letters.length; i++) {
      var l = letters[i];
      if (l === '') continue;
      if (rev[l]) out += rev[l];
      else out += '?';
    }
    result.push(out);
  }
  return result.join(' ');
}

// Função para cifra ROT13
function cipherROT13(text) {
  var shift = 13; // Define o deslocamento da cifra ROT13

  var result = "";
  for (var i = 0; i < text.length; i++) {
    var charCode = text.charCodeAt(i);

    // Verifica se o caractere é uma letra maiúscula
    if (charCode >= 65 && charCode <= 90) {
      var shiftedCharCode = ((charCode - 65 + shift) % 26) + 65;
      result += String.fromCharCode(shiftedCharCode);
    }
    // Verifica se o caractere é uma letra minúscula
    else if (charCode >= 97 && charCode <= 122) {
      var shiftedCharCode = ((charCode - 97 + shift) % 26) + 97;
      result += String.fromCharCode(shiftedCharCode);
    }
    // Mantém os caracteres não alfabéticos inalterados
    else {
      result += text[i];
    }
  }

  return result;
}

// Função para cifra DES
function cipherDES(text) {
  // lógica para a cifra DES
  var key = CryptoJS.enc.Hex.parse("0123456789abcdef");
  var iv = CryptoJS.enc.Hex.parse("abcdef9876543210");
  var encrypted = CryptoJS.DES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString();
}

// Função para cifra AES
function cipherAES(text) {
  // lógica para a cifra AES
  var key = CryptoJS.enc.Hex.parse("0123456789abcdef0123456789abcdef");
  var iv = CryptoJS.enc.Hex.parse("abcdef9876543210abcdef9876543210");
  var encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return encrypted.toString();
}

// apenas hash agr

function convertToHash() {
  var textInput = document.getElementById("text").value;
  var resultElement = document.getElementById("result");
  var hashType = document.getElementById("hashType").value;

  // Verifica se o texto de entrada está vazio
  if (textInput === "") {
    resultElement.innerText = "Por favor, insira um texto.";
    return;
  }

  // Converte o texto para o hash selecionado
  var hashResult = "";
  if (hashType === "md5") {
    hashResult = calculateMD5(textInput);
  } else if (hashType === "sha1") {
    hashResult = calculateSHA1(textInput);
  } else if (hashType === "sha256") {
    hashResult = calculateSHA256(textInput);
  } else if (hashType === "sha3-256") {
    hashResult = calculateSHA3_256(textInput);
  }

  // Atualiza o resultado na página
  resultElement.innerText = hashResult;
}

// Função para calcular a hash MD5
function calculateMD5(text) {
  // lógica para calcular a hash MD5
  var hash = CryptoJS.MD5(text).toString();

  return hash;
}

// Função para calcular a hash SHA1
function calculateSHA1(text) {
  // lógica para calcular a hash SHA1
  var hash = CryptoJS.SHA1(text).toString();

  return hash;
}

// Função para calcular a hash SHA256
function calculateSHA256(text) {
  // lógica para calcular a hash SHA256
  var hash = CryptoJS.SHA256(text).toString();

  return hash;
}

// Função para calcular a hash SHA3-256
function calculateSHA3_256(text) {
  // lógica para calcular a hash SHA3-256
  var hash = CryptoJS.SHA3(text, { outputLength: 256 }).toString();

  return hash;
}

// PoC: tentativa simples de 'crack' por wordlist (lado cliente) - pequena lista embutida
function crackHash(targetHash, hashType) {
  if (!targetHash) return null;
  var defaultCandidates = [
    '123456','password','123456789','12345678','12345','qwerty','abc123','senha','senha123','p@ssw0rd','password1','admin','letmein','welcome','monkey','dragon','teste','test'
  ];
  var candidates = Array.isArray(userWordlist) && userWordlist.length ? userWordlist.concat(defaultCandidates) : defaultCandidates;
  targetHash = String(targetHash).toLowerCase();
  for (var i = 0; i < candidates.length; i++) {
    var c = String(candidates[i]);
    if (!c) continue;
    var h = '';
    if (hashType === 'md5') h = CryptoJS.MD5(c).toString();
    else if (hashType === 'sha1') h = CryptoJS.SHA1(c).toString();
    else if (hashType === 'sha256') h = CryptoJS.SHA256(c).toString();
    else if (hashType === 'sha3-256') h = CryptoJS.SHA3(c, { outputLength: 256 }).toString();
    if (h.toLowerCase() === targetHash) return c;
  }
  return null;
}

// Handle file upload (wordlist)
function handleWordlistUpload() {
  var input = document.getElementById('modalWordlistFile') || document.getElementById('wordlistFile');
  var status = document.getElementById('wordlistStatus');
  if (!input || !input.files || input.files.length === 0) {
    status.textContent = 'Nenhum arquivo selecionado.';
    return;
  }
  var file = input.files[0];
  // For large files we defer to the worker streaming path; still read a small preview
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result || '';
    var lines = text.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
    // keep only first 500 lines as a quick preview in main thread
    userWordlist = lines.slice(0,500);
    // store selected file for worker streaming
    window.__selectedWordlistFile = file;
    status.textContent = 'Arquivo: ' + userWordlist.length + ' palavras';
    // set source to custom and show open button
    var sourceSel = document.getElementById('wordlistSource'); if (sourceSel) sourceSel.value = 'custom';
    var openBtn = document.getElementById('openWordlistModalBtn'); if (openBtn) openBtn.style.display = 'inline-block';
    // Close modal if open
    var modal = document.getElementById('wordlistModal'); if (modal) modal.style.display='none';
  };
  reader.onerror = function() { status.textContent = 'Erro ao ler o arquivo.'; };
  // read first 200KB only as preview
  var blob = file.slice(0, 200*1024);
  reader.readAsText(blob);
}

function startWorkerCrackWithFile(file, hash, hashType) {
  if (crackWorker) {
    try { crackWorker.terminate(); } catch(e){}
    crackWorker = null;
  }
  crackWorker = new Worker('js/crackWorker.js');
  currentWorkerRunning = true;
  var progressEl = document.getElementById('crackProgress');
  var abortBtn = document.getElementById('abortCrackBtn');
  if (progressEl) { progressEl.value = 0; progressEl.style.display = 'inline-block'; }
  if (abortBtn) { abortBtn.style.display='inline-block'; }
  lastProgressTimestamp = 0; lastProcessedCount = 0;

  crackWorker.onmessage = function(ev) {
    var d = ev.data;
    if (!d) return;
    if (d.type === 'progress') {
      // Update progress and log (compute speed)
      var now = Date.now();
      if (d.fileSize && d.processedBytes) {
        var pct = Math.min(100, Math.floor((d.processedBytes / d.fileSize) * 100));
        if (progressEl) progressEl.value = pct;
        var log = document.getElementById('crackLog'); if (log) log.textContent = pct + '%';
      } else if (d.processed && d.total) {
        var pct = Math.min(100, Math.floor((d.processed / d.total)*100));
        if (progressEl) progressEl.value = pct;
        var processed = d.processed || 0;
        var delta = 0;
        if (lastProgressTimestamp) {
          var dt = (now - lastProgressTimestamp)/1000;
          var dproc = processed - lastProcessedCount;
          delta = dt>0 ? Math.round(dproc/dt) : 0;
        }
        lastProgressTimestamp = now; lastProcessedCount = processed;
        var log = document.getElementById('crackLog'); if (log) log.textContent = processed + ' / ' + d.total + ' (~' + delta + ' l/s)';
      }
    } else if (d.type === 'found') {
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = d.word;
      crackWorker.terminate(); crackWorker = null;
    } else if (d.type === 'batchDone') {
      // worker couldn't stream file but processed a batch - ignore here (file streaming expected)
      // main will handle batch flow
      // no-op
    } else if (d.type === 'done') {
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Não encontrado na wordlist.';
      crackWorker.terminate(); crackWorker = null;
    } else if (d.type === 'aborted') {
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Processo abortado.';
      crackWorker.terminate(); crackWorker = null;
    } else if (d.type === 'error') {
      // If streaming is not supported, fallback to chunked FileReader -> batch send
      if (String(d.message || '').toLowerCase().indexOf('stream') !== -1) {
        // terminate current worker and create a new worker for batch processing
        try { crackWorker.terminate(); } catch(e){}
        crackWorker = new Worker('js/crackWorker.js');
        // start processing in batches
        chunkFileInBatches(file, hash, hashType);
        return;
      }
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Erro: ' + (d.message||'');
      crackWorker.terminate(); crackWorker = null;
    }
  };

  crackWorker.postMessage({cmd:'start', hash:hash, hashType:hashType, file:file});
}

// Fallback for browsers/workers that can't stream files: read the file in chunks
// on the main thread, split into lines, and send batches to the worker via startBatch.
function chunkFileInBatches(file, hash, hashType) {
  if (!file) {
    var resEl = document.getElementById('result'); if (resEl) resEl.textContent = 'Nenhum arquivo para processar.';
    return;
  }
  var chunkSize = 256 * 1024; // 256KB
  var batchSize = 2000; // candidates per batch
  var offset = 0;
  var leftover = '';
  var pending = [];
  var processingBatch = false;
  var canceled = false;
  // clear any previous chunk cancel flag
  chunkedCancelFlag = false;
  var processedCandidates = 0;

  var progressEl = document.getElementById('crackProgress');
  var abortBtn = document.getElementById('abortCrackBtn');
  if (progressEl) { progressEl.style.display='inline-block'; progressEl.value = 0; }
  if (abortBtn) { abortBtn.style.display='inline-block'; }

  // ensure the worker message handler handles batch lifecycle
  crackWorker.onmessage = function(ev) {
    var d = ev.data;
    if (!d) return;
    if (d.type === 'found') {
      canceled = true;
      chunkedCancelFlag = true;
      processingBatch = false;
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = d.word;
      try { crackWorker.terminate(); } catch(e){}
      crackWorker = null;
    } else if (d.type === 'batchDone') {
      // worker finished a batch, allow sending next
      processingBatch = false;
      processedCandidates += (d.processed || 0);
      // update progress (approx) using file offset / size
      if (progressEl && file.size) {
        var pct = Math.min(100, Math.floor((offset / file.size) * 100));
        progressEl.value = pct;
        var log = document.getElementById('crackLog'); if (log) log.textContent = processedCandidates + ' candidates processed';
      }
      // send next batch if available
      maybeSendNextBatch();
    } else if (d.type === 'error') {
      processingBatch = false;
      canceled = true;
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var res = document.getElementById('result'); if (res) res.textContent = 'Erro: ' + (d.message||'');
      try { crackWorker.terminate(); } catch(e){}
      crackWorker = null;
    } else if (d.type === 'aborted') {
      processingBatch = false; canceled = true; currentWorkerRunning = false; chunkedCancelFlag = true;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var res = document.getElementById('result'); if (res) res.textContent = 'Processo abortado.';
      try { crackWorker.terminate(); } catch(e){}
      crackWorker = null;
    }
  };

  function sendBatch(batch) {
    if (!crackWorker) return;
    processingBatch = true;
    try {
      crackWorker.postMessage({cmd:'startBatch', candidates: batch, hash: hash, hashType: hashType});
    } catch (e) {
      processingBatch = false;
    }
  }

  function maybeSendNextBatch() {
    if (canceled || chunkedCancelFlag) return;
    if (processingBatch) return;
    if (pending.length === 0) {
      // if no pending and more to read, wait for read loop; if finished reading, finalize
      if (offset >= file.size) {
        // all data read and no pending candidates -> finished
        currentWorkerRunning = false;
        if (progressEl) progressEl.style.display='none';
        if (abortBtn) abortBtn.style.display='none';
        var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Não encontrado na wordlist.';
        try { crackWorker.terminate(); } catch(e){}
        crackWorker = null;
      }
      return;
    }
    // take up to batchSize candidates
    var batch = pending.splice(0, batchSize);
    sendBatch(batch);
  }

  function readNextChunk() {
    if (canceled || chunkedCancelFlag) return;
    if (offset >= file.size) {
      // no more to read; ensure leftover is processed
      if (leftover) {
        pending.push(leftover);
        leftover = '';
      }
      // kick sending if idle
      maybeSendNextBatch();
      return;
    }
    var end = Math.min(file.size, offset + chunkSize);
    var blob = file.slice(offset, end);
    var reader = new FileReader();
    reader.onload = function(e) {
      if (canceled) return;
      var txt = e.target.result || '';
      var data = leftover + txt;
      var parts = data.split(/\r?\n/);
      leftover = parts.pop();
      for (var i = 0; i < parts.length; i++) {
        var s = parts[i].trim(); if (s) pending.push(s);
      }
      // attempt to send batches while pending is large
      if (!processingBatch && pending.length >= batchSize) {
        maybeSendNextBatch();
      }
      // update progress based on bytes read
      offset = end;
      if (progressEl && file.size) {
        var pct = Math.min(100, Math.floor((offset / file.size) * 100));
        progressEl.value = pct;
        var log = document.getElementById('crackLog'); if (log) log.textContent = (offset) + ' / ' + file.size + ' bytes';
      }
      // schedule next chunk read
      setTimeout(function() { readNextChunk(); }, 0);
    };
    reader.onerror = function() {
      canceled = true; currentWorkerRunning = false; chunkedCancelFlag = true;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var res = document.getElementById('result'); if (res) res.textContent = 'Erro ao ler arquivo.';
      try { crackWorker.terminate(); } catch(e){}
      crackWorker = null;
    };
    reader.readAsText(blob);
  }

  // start reading and processing
  readNextChunk();
}


function startWorkerCrackWithCandidates(candidates, hash, hashType) {
  if (crackWorker) {
    try { crackWorker.terminate(); } catch(e){}
    crackWorker = null;
  }
  crackWorker = new Worker('js/crackWorker.js');
  currentWorkerRunning = true;
  var progressEl = document.getElementById('crackProgress');
  var abortBtn = document.getElementById('abortCrackBtn');
  if (progressEl) { progressEl.value = 0; progressEl.style.display = 'inline-block'; }
  if (abortBtn) { abortBtn.style.display='inline-block'; }
  lastProgressTimestamp = 0; lastProcessedCount = 0;

  crackWorker.onmessage = function(ev) {
    var d = ev.data;
    if (!d) return;
    if (d.type === 'progress') {
      if (d.processed && d.total) {
        var pct = Math.min(100, Math.floor((d.processed / d.total)*100));
        if (progressEl) progressEl.value = pct;
      }
    } else if (d.type === 'found') {
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = d.word;
      crackWorker.terminate(); crackWorker = null;
    } else if (d.type === 'batchDone' || d.type === 'done') {
      // batch finished (we sent candidates as a single batch)
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Não encontrado na wordlist.';
      crackWorker.terminate(); crackWorker = null;
    } else if (d.type === 'aborted') {
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Processo abortado.';
      crackWorker.terminate(); crackWorker = null;
    } else if (d.type === 'error') {
      currentWorkerRunning = false;
      if (progressEl) progressEl.style.display='none';
      if (abortBtn) abortBtn.style.display='none';
      var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Erro: ' + (d.message||'');
      crackWorker.terminate(); crackWorker = null;
    }
  };

  crackWorker.postMessage({cmd:'start', hash:hash, hashType:hashType, candidates:candidates});
}

// Clear result and UI helpers
function clearResult() {
  var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = '';
  var progressEl = document.getElementById('crackProgress'); if (progressEl) { progressEl.style.display='none'; progressEl.value=0; }
  var abortBtn = document.getElementById('abortCrackBtn'); if (abortBtn) abortBtn.style.display='none';
  var log = document.getElementById('crackLog'); if (log) log.textContent = '';
}

window.clearResult = clearResult;

function abortWorker() {
  if (crackWorker) {
    try { crackWorker.postMessage({cmd:'abort'}); } catch(e){}
    try { crackWorker.terminate(); } catch(e){}
    // set chunk cancel flag so chunkFileInBatches stops reading
    chunkedCancelFlag = true;
    crackWorker = null; currentWorkerRunning = false;
    var progressEl = document.getElementById('crackProgress'); if (progressEl) progressEl.style.display='none';
    var abortBtn = document.getElementById('abortCrackBtn'); if (abortBtn) abortBtn.style.display='none';
    var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = 'Processo abortado.';
  }
}

function runCrackFromUI() {
  var hash = document.getElementById('text').value.trim();
  var hashType = document.getElementById('hashType').value;
  var resultElement = document.getElementById('result');
  if (!hash) { resultElement.textContent = 'Insira um hash para decodificar.'; return; }
  resultElement.textContent = 'Tentando...';
  setTimeout(function() {
    var found = crackHash(hash, hashType);
    resultElement.textContent = found ? ('Encontrado: ' + found) : 'Não encontrado na wordlist.';
  }, 20);
}

// Expose functions used by inline handlers and provide module namespace
window.convertValue = convertValue;
window.showConversionOptions = showConversionOptions;
window.convertToHash = convertToHash;
window.handleWordlistUpload = handleWordlistUpload;
window.runCrackFromUI = runCrackFromUI;
window.startWorkerCrackWithFile = startWorkerCrackWithFile;
window.abortWorker = abortWorker;
// Load default wordlist from file when requested
function loadDefaultWordlist() {
  return new Promise(function(resolve, reject){
    fetch('wordlists/common.txt').then(function(resp){
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      return resp.text();
    }).then(function(txt){
      var lines = txt.split(/\r?\n/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length>0; });
      userWordlist = lines;
      var status = document.getElementById('wordlistStatus'); if (status) status.textContent = 'Padrão: ' + lines.length + ' palavras';
      resolve(lines);
    }).catch(function(err){
      var status = document.getElementById('wordlistStatus'); if (status) status.textContent = 'Erro ao carregar wordlist padrão.';
      reject(err);
    });
  });
}

// Orchestrate: process default candidates first, then stream the uploaded file.
function startMergedCrack(file, hash, hashType) {
  // Ensure default is loaded
  var doStart = function() {
    if (!Array.isArray(userWordlist) || userWordlist.length === 0) {
      // nothing to batch, just stream file
      startWorkerCrackWithFile(file, hash, hashType);
      return;
    }
    // Create a temporary worker to process the default batch first
    var batchWorker = new Worker('js/crackWorker.js');
    var progressEl = document.getElementById('crackProgress');
    var abortBtn = document.getElementById('abortCrackBtn');
    if (progressEl) { progressEl.style.display='inline-block'; progressEl.value = 0; }
    if (abortBtn) { abortBtn.style.display='inline-block'; }
    var cleaned = userWordlist.slice(0);
    batchWorker.onmessage = function(ev) {
      var d = ev.data;
      if (!d) return;
      if (d.type === 'progress') {
        if (d.processed && d.total && progressEl) progressEl.value = Math.min(100, Math.floor((d.processed/d.total)*100));
      } else if (d.type === 'found') {
        if (progressEl) progressEl.style.display='none';
        if (abortBtn) abortBtn.style.display='none';
        var resultEl = document.getElementById('result'); if (resultEl) resultEl.textContent = d.word;
        try { batchWorker.terminate(); } catch(e){}
        batchWorker = null;
      } else if (d.type === 'batchDone') {
        // finished default batch, proceed to stream file
        try { batchWorker.terminate(); } catch(e){}
        batchWorker = null;
        if (progressEl) { progressEl.style.display='none'; progressEl.value = 0; }
        if (abortBtn) { abortBtn.style.display='none'; }
        // now start real worker for file streaming (this will show progress again)
        startWorkerCrackWithFile(file, hash, hashType);
      } else if (d.type === 'error') {
        var res = document.getElementById('result'); if (res) res.textContent = 'Erro: ' + (d.message||'');
        try { batchWorker.terminate(); } catch(e){}
        batchWorker = null;
      }
    };
    // send default candidates as a batch
    try {
      batchWorker.postMessage({cmd:'start', hash:hash, hashType:hashType, candidates:cleaned});
    } catch (err) {
      var res = document.getElementById('result'); if (res) res.textContent = 'Erro ao iniciar processamento.';
      try { batchWorker.terminate(); } catch(e){}
      batchWorker = null;
      // fallback to streaming only
      startWorkerCrackWithFile(file, hash, hashType);
    }
  };
  // load default if necessary
  if (!Array.isArray(userWordlist) || userWordlist.length === 0) {
    loadDefaultWordlist().then(doStart).catch(function(){ doStart(); });
  } else {
    doStart();
  }
}
window.Cryptool = {
  convertValue: convertValue,
  showConversionOptions: showConversionOptions,
  crackHash: crackHash
};

// Initialize event listeners (replace inline handlers)
document.addEventListener('DOMContentLoaded', function() {
  var conv = document.getElementById('conversionType');
  if (conv) conv.addEventListener('change', showConversionOptions);
  var fileInput = document.getElementById('wordlistFile');
  // file input is now in modal; modal input listener set below
  // if (fileInput) fileInput.addEventListener('change', handleWordlistUpload);
  var abortBtn = document.getElementById('abortCrackBtn');
  if (abortBtn) abortBtn.addEventListener('click', function(){ abortWorker(); });
  var convertBtn = document.getElementById('convertBtn');
  if (convertBtn) {
    // ensure Convert triggers convertValue
    convertBtn.addEventListener('click', function(e){
      // If cracking scenario with file selected, start worker
      var convType = (document.getElementById('conversionType')||{}).value || 'select';
      var action = (document.getElementById('actionType') || {}).value || 'encode';
      var wordlistSource = (document.getElementById('wordlistSource') || {}).value || 'default';
      var selectedFile = window.__selectedWordlistFile || null;
      if (convType === 'hash' && action === 'decode') {
        var hash = (document.getElementById('text') || {}).value || '';
        var hashType = (document.getElementById('hashType') || {}).value || 'md5';
        if (!hash) { document.getElementById('result').textContent = 'Insira um hash para decodificar.'; return; }
        if (wordlistSource === 'custom' && selectedFile) {
          var merge = (document.getElementById('mergeDefault') || {}).checked;
          var preview = Array.isArray(userWordlist) && userWordlist.length ? userWordlist : null;
          // If merge requested and we have a small preview, merge default + preview and run in-memory batch
          if (merge) {
            if (preview && preview.length < 2000) {
              loadDefaultWordlist().then(function(defaults){
                var merged = defaults.concat(preview);
                startWorkerCrackWithCandidates(merged, hash, hashType);
              }).catch(function(){
                // fallback to streaming merged processing
                startMergedCrack(selectedFile, hash, hashType);
              });
            } else {
              // large file: process default first then stream file
              startMergedCrack(selectedFile, hash, hashType);
            }
            return;
          }
          // No merge: if we have a small preview, run candidates directly for speed; otherwise stream the file
          if (preview && preview.length < 2000) {
            startWorkerCrackWithCandidates(preview, hash, hashType);
          } else {
            startWorkerCrackWithFile(selectedFile, hash, hashType);
          }
          return;
        } else {
          // load default wordlist into userWordlist if not loaded
          if (!Array.isArray(userWordlist) || userWordlist.length === 0) {
            loadDefaultWordlist().then(function(){
              startWorkerCrackWithCandidates(userWordlist, hash, hashType);
            }).catch(function(){
              // fallback to built-in crack
              var found = crackHash(hash, hashType);
              document.getElementById('result').textContent = found || 'Não encontrado na wordlist.';
            });
          } else {
            startWorkerCrackWithCandidates(userWordlist, hash, hashType);
          }
          return;
        }
      }
      // Otherwise default behavior
      convertValue();
    });
  }
  var clearBtn = document.getElementById('clearResultBtn');
  if (clearBtn) clearBtn.addEventListener('click', function(){ clearResult(); });
  // actionType change should toggle wordlistControl visibility when decode selected
  var actionSelect = document.getElementById('actionType');
  if (actionSelect) actionSelect.addEventListener('change', function(){
    var convType = (document.getElementById('conversionType')||{}).value;
    var action = (document.getElementById('actionType')||{}).value;
    var control = document.getElementById('wordlistControl');
    if (control) {
      if (convType === 'hash' && action === 'decode') control.style.display = 'block'; else control.style.display = 'none';
    }
    // If user selected decode for hash and default source is selected, load default wordlist if not loaded
    var wordlistSource = (document.getElementById('wordlistSource')||{}).value || 'default';
    if (convType === 'hash' && action === 'decode' && wordlistSource === 'default' && (!Array.isArray(userWordlist) || userWordlist.length === 0)) {
      loadDefaultWordlist();
    }
  });

  // modal controls
  var openModalBtn = document.getElementById('openWordlistModalBtn');
  var modal = document.getElementById('wordlistModal');
  var closeModal = document.getElementById('closeModal');
  var modalUploadBtn = document.getElementById('modalUploadBtn');
  var modalInput = document.getElementById('modalWordlistFile');
  if (openModalBtn && modal) openModalBtn.addEventListener('click', function(){ modal.style.display='flex'; });
  if (closeModal && modal) closeModal.addEventListener('click', function(){ modal.style.display='none'; });
  if (modalUploadBtn && modalInput) modalUploadBtn.addEventListener('click', function(){ handleWordlistUpload(); });
  // wordlist source select
  var wordlistSource = document.getElementById('wordlistSource');
  if (wordlistSource) wordlistSource.addEventListener('change', function(){
    var v = (wordlistSource.value||'default');
    var status = document.getElementById('wordlistStatus');
    if (v === 'default') {
      loadDefaultWordlist();
      // hide modal button when using default
      var openBtn = document.getElementById('openWordlistModalBtn'); if (openBtn) openBtn.style.display='none';
      // hide merge checkbox when default selected
      var mergeRow = document.querySelector('.wordlist-merge'); if (mergeRow) mergeRow.style.display='none';
      // clear any selected custom file
      window.__selectedWordlistFile = null;
    } else {
      // clear preview and wait for user upload
      userWordlist = [];
      window.__selectedWordlistFile = null;
      if (status) status.textContent = 'Arquivo: (Vazio)';
      var openBtn = document.getElementById('openWordlistModalBtn'); if (openBtn) openBtn.style.display='inline-block';
      // show merge checkbox when custom selected
      var mergeRow2 = document.querySelector('.wordlist-merge'); if (mergeRow2) mergeRow2.style.display='block';
    }
    // reset UI hints
    var progressEl = document.getElementById('crackProgress'); if (progressEl) { progressEl.style.display='none'; progressEl.value=0; }
    var log = document.getElementById('crackLog'); if (log) log.textContent = '';
  });
});

})(window);
