export function mapArgsToArray(argsString) {
  const argsArray = argsString.split(",");

  const parsedArray = argsArray.map((arg) => {
    if (/^-?\d+$/.test(arg)) {
      return parseInt(arg);
    } else if (/^-?\d*\.\d+$/.test(arg)) {
      return parseFloat(arg);
    } else {
      return arg;
    }
  });

  return parsedArray.filter((arg) => arg !== "");
}

export function loadScript(src) {
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = src;
  script.onload = () => {
    console.log(src + "  loaded successfully");
  };
  document.head.appendChild(script);
}

export function sendUnityMessage(type, content) {
  window.unityInstance.SendMessage(
    "LyncManager",
    "GetMessage",
    JSON.stringify({
      type,
      content: JSON.stringify(content),
    })
  );
}

export function sendUnityError(origin, message) {
  window.unityInstance.SendMessage(
    "LyncManager",
    "GetMessage",
    JSON.stringify({
      type: JSMessageType.ERROR,
      content: JSON.stringify({ origin, message }),
    })
  );
}

export var JSMessageType = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  ERROR: "ERROR",
  TRANSACTION: "TRANSACTION",
  CONNECTED: "CONNECTED",
};
