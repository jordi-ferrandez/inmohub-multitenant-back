import { app } from "./app";

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || "localhost";
app.listen(port, host, () => {
  console.log(`🚀 Backend corriendo en http://${host}:${port}`);
  console.log(`🚀 100% seguro de que es ${host}:${port}`);
});
