// Cryptool - Matheus Laidler
// Função para converter o valor
function convertValue() {
  var conversionType = document.getElementById("conversionType").value;
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
      convertedValue = convertCryptoCipher(inputValue);
      break;
    case "hash":
      convertToHash();
      return;
    default:
      resultElement.innerText = "Opção de conversão inválida.";
      return;
  }

  // Atualiza o resultado na página
  resultElement.innerHTML = convertedValue;
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
function convertCryptoCipher(inputValue) {
  var conversionSubType = document.getElementById("cryptoCipherSubType").value;

  // Realiza a conversão com base no subtipo selecionado
  switch (conversionSubType) {
    case "morse":
      return convertToMorse(inputValue);
    case "caesar":
      return cipherCaesar(inputValue);
    case "base64":
      return convertToBase64(inputValue);
    case "rot13":
      return cipherROT13(inputValue);
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
  var base64Result = btoa(text);
  return base64Result;
}

// Função para cifra de César
function cipherCaesar(text) {
  var shift = 3; // Define o deslocamento da cifra de César

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
