import app from "./app";
import socket from "./socket";

const server = app.listen(app.get("port"), () => {
  console.log("server on port", app.get("port"));
});

socket.init(server);