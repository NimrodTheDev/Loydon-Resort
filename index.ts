import express from "express";
import path from "path";
import router from "./routes/page";

const App = express();
App.use(express.json());
App.set("view engine", "ejs");
App.set("views", path.join(process.cwd(), "views"));
App.use(express.static("public"));
App.use("/", router);
App.listen(3010, () => console.log("listening on http://localhost:3010"));
