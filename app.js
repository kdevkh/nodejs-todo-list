import express from "express";
import connect from "./schemas/index.js";
import todosRouter from "./routes/todos.router.js";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";

const app = express(); // express library를 가져와서 app을 생성하고, app.use를 통해 전역으로 미들웨어를 등록함
const PORT = 3000;

connect();

// Express에서 req.body에 접근하여 body 데이터를 사용할 수 있도록 설정합니다.
app.use(express.json()); // body-parser 구현 // 미들웨어 1
app.use(express.urlencoded({ extended: true })); // urlencoded를 통해 content type이 true인 경우 body 데이터를 가져올 수 있도록 구현 // 미들웨어 2
app.use(express.static("./assets")); // FE파일 서빙용 // 미들웨어 3

// 2-11 middleware 예시 // 미들웨어 4
app.use((req, res, next) => {
  console.log("Request URL:", req.originalUrl, "-", new Date());
  next();
});

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({ message: "Hi!" });
}); // 10~14번째 줄은 router를 생성해서 API를 구현

app.use("/api", [router, todosRouter]); // 해당 라우터를 전역 미들웨어에 등록해서 앞에 /api가 붙은 경우에만 접근 가능하도록 함 // 미들웨어 5

// 에러 처리 미들웨어를 등록한다
app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
